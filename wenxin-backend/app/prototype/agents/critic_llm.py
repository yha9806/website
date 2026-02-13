"""CriticLLM — hybrid rule + Agent bridge for L1-L5 evaluation.

Drop-in replacement for CriticAgent: same ``run(CritiqueInput) -> CritiqueOutput``
interface, but selectively escalates low-confidence dimensions to the AgentRuntime
for LLM-based re-evaluation via Function Calling.

Flow per candidate per dimension:
    1. CriticRules.score()            -> baseline score
    2. LayerState.should_escalate()?
       - YES -> AgentRuntime.evaluate() -> merge Agent result
       - NO  -> keep rule score
    3. Assemble CritiqueOutput (identical schema to CriticAgent)

Cost guardrails:
    - max_escalations=3 per candidate (of 5 dims)
    - max_steps=3 per Agent ReAct loop
    - ModelRouter budget constraint
    - No API key -> 100% rule fallback (zero cost)
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any

from app.prototype.agents.agent_runtime import AgentContext, AgentResult, AgentRuntime
from app.prototype.agents.critic_config import CriticConfig, DIMENSIONS
from app.prototype.agents.critic_risk import RiskTagger
from app.prototype.agents.critic_rules import CriticRules
from app.prototype.agents.critic_types import (
    CandidateScore,
    CritiqueInput,
    CritiqueOutput,
    DimensionScore,
)
from app.prototype.agents.layer_state import (
    CrossLayerSignal,
    LayerState,
    SignalType,
    init_layer_states,
)
from app.prototype.agents.model_router import ModelRouter
from app.prototype.agents.tool_registry import build_critic_tool_registry
from app.prototype.checkpoints.critic_checkpoint import save_critic_checkpoint

logger = logging.getLogger(__name__)

# Layer ID -> label mapping
_LAYER_LABELS: dict[str, str] = {
    "visual_perception": "L1",
    "technical_analysis": "L2",
    "cultural_context": "L3",
    "critical_interpretation": "L4",
    "philosophical_aesthetic": "L5",
}

# Thread pool for sync -> async bridge
_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="critic_llm")


class CriticLLM:
    """Hybrid rule + LLM critic with the same interface as CriticAgent."""

    def __init__(
        self,
        config: CriticConfig | None = None,
        max_escalations: int = 3,
        max_agent_steps: int = 5,
        scout_service: Any = None,
        progressive: bool = False,
    ) -> None:
        self._config = config or CriticConfig()
        self._rules = CriticRules()
        self._risk_tagger = RiskTagger()
        self._max_escalations = max_escalations
        self._max_agent_steps = max_agent_steps
        self._scout_service = scout_service
        self._progressive = progressive  # v2: L1→L5 serial mode

        # Agent-ness metrics (cumulative across all candidates)
        self._total_escalations = 0
        self._total_tool_calls = 0
        self._total_re_plans = 0  # dims where Agent overrode rule score significantly
        self._total_dims_evaluated = 0

        # v2: cross-layer signals (accumulated per run, consumed by Queen)
        self.cross_layer_signals: list[CrossLayerSignal] = []

        # Layer 1b: FixItPlan (set after run(), consumed by orchestrator)
        self.fix_it_plan: "FixItPlan | None" = None
        # Layer 1c: NeedMoreEvidence (set after run(), consumed by orchestrator)
        self.need_more_evidence: "NeedMoreEvidence | None" = None

    # ------------------------------------------------------------------
    # Public API — identical to CriticAgent.run()
    # ------------------------------------------------------------------

    def run(self, critique_input: CritiqueInput) -> CritiqueOutput:
        """Execute the critique pipeline on all candidates.

        Returns CritiqueOutput with the same schema as CriticAgent.
        """
        t0 = time.monotonic()
        cfg = self._config

        # Empty candidates -> immediate failure
        if not critique_input.candidates:
            elapsed_ms = int((time.monotonic() - t0) * 1000)
            output = CritiqueOutput(
                task_id=critique_input.task_id,
                scored_candidates=[],
                best_candidate_id=None,
                rerun_hint=[],
                created_at=datetime.now(timezone.utc).isoformat(),
                latency_ms=elapsed_ms,
                success=False,
                error="no candidates provided",
            )
            save_critic_checkpoint(output)
            return output

        # Check if any LLM API key is available
        has_api_key = self._has_any_api_key()

        scored: list[CandidateScore] = []

        for candidate in critique_input.candidates:
            # 1. Rule-based baseline scores for all L1-L5 dims
            dim_scores = self._rules.score(
                candidate=candidate,
                evidence=critique_input.evidence,
                cultural_tradition=critique_input.cultural_tradition,
            )

            # 2. Risk tags
            risk_tuples = self._risk_tagger.tag(
                candidate=candidate,
                evidence=critique_input.evidence,
                cultural_tradition=critique_input.cultural_tradition,
            )
            risk_tag_names = [t[0] for t in risk_tuples]
            risk_severities = {t[0]: t[1] for t in risk_tuples}

            # 3. Selective Agent escalation
            if has_api_key:
                if self._progressive:
                    dim_scores = self._escalate_serial(
                        dim_scores=dim_scores,
                        candidate=candidate,
                        critique_input=critique_input,
                    )
                else:
                    dim_scores = self._escalate_dimensions(
                        dim_scores=dim_scores,
                        candidate=candidate,
                        critique_input=critique_input,
                    )

            # 3b. Detect cross-layer signals
            signals = self._detect_cross_layer_signals(dim_scores)
            self.cross_layer_signals.extend(signals)

            self._total_dims_evaluated += len(dim_scores)

            # 4. Weighted total
            weighted_total = sum(
                cfg.weights.get(ds.dimension, 0.0) * ds.score
                for ds in dim_scores
            )

            # 5. Gate decision
            rejected_reasons: list[str] = []

            if weighted_total < cfg.pass_threshold:
                rejected_reasons.append(
                    f"weighted_total {weighted_total:.4f} < threshold {cfg.pass_threshold}"
                )

            for ds in dim_scores:
                if ds.score < cfg.min_dimension_score:
                    rejected_reasons.append(
                        f"{ds.dimension} score {ds.score:.4f} < min {cfg.min_dimension_score}"
                    )

            if cfg.critical_risk_blocks:
                for tag_name, severity in risk_severities.items():
                    if severity == "critical":
                        rejected_reasons.append(f"critical risk: {tag_name}")

            gate_passed = len(rejected_reasons) == 0

            scored.append(CandidateScore(
                candidate_id=candidate.get("candidate_id", "unknown"),
                dimension_scores=dim_scores,
                weighted_total=weighted_total,
                risk_tags=risk_tag_names,
                gate_passed=gate_passed,
                rejected_reasons=rejected_reasons,
            ))

        # 6. Sort by weighted_total descending
        scored.sort(key=lambda s: s.weighted_total, reverse=True)

        # 7. Truncate to top_k
        scored = scored[:cfg.top_k]

        # 8. Select best candidate (highest score that passed gate)
        best_id: str | None = None
        for s in scored:
            if s.gate_passed:
                best_id = s.candidate_id
                break

        # 9. Rerun hint: dimensions with score < 0.3 across all candidates
        low_dims: set[str] = set()
        for s in scored:
            for ds in s.dimension_scores:
                if ds.score < 0.3:
                    low_dims.add(ds.dimension)
        rerun_hint = sorted(low_dims)

        elapsed_ms = int((time.monotonic() - t0) * 1000)

        output = CritiqueOutput(
            task_id=critique_input.task_id,
            scored_candidates=scored,
            best_candidate_id=best_id,
            rerun_hint=rerun_hint,
            created_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=elapsed_ms,
            success=True,
            error=None,
        )

        # Layer 1b: Generate FixItPlan from low-scoring dimensions
        self.fix_it_plan = self._generate_fix_it_plan(scored)

        # Layer 1c: Check for evidence gaps
        evidence_coverage = critique_input.evidence.get("evidence_coverage", 0.0)
        self.need_more_evidence = self._check_evidence_gaps(
            scored, evidence_coverage, critique_input.cultural_tradition,
        )

        save_critic_checkpoint(output)
        return output

    # ------------------------------------------------------------------
    # Agent-ness metrics
    # ------------------------------------------------------------------

    def get_agent_metrics(self) -> dict:
        """Return Agent-ness metrics for this CriticLLM instance."""
        total_dims = max(self._total_dims_evaluated, 1)
        return {
            "escalation_rate": round(self._total_escalations / total_dims, 4),
            "tool_calls": self._total_tool_calls,
            "re_plan_rate": round(self._total_re_plans / max(self._total_escalations, 1), 4),
            "total_escalations": self._total_escalations,
            "total_dims_evaluated": self._total_dims_evaluated,
        }

    # ------------------------------------------------------------------
    # Cross-layer signal detection
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_cross_layer_signals(
        dim_scores: list[DimensionScore],
    ) -> list[CrossLayerSignal]:
        """Detect cross-layer signals from score patterns.

        Rules:
        1. L5 vs L1 score diff > 0.3 → REINTERPRET(L5→L1)
        2. L5 vs L2 score diff > 0.3 → REINTERPRET(L5→L2)
        3. L3 < 0.4 but L5 > 0.8 → CONFLICT(L5→L3)
        4. L4 vs L1 diff > 0.25 → EVIDENCE_GAP(L4→L1)
        5. L5 > 0.7 and L3 > 0.7 → CONFIRMATION(L5→L3)
        """
        signals: list[CrossLayerSignal] = []
        score_map = {ds.dimension: ds.score for ds in dim_scores}

        l1 = score_map.get("visual_perception", 0.5)
        l2 = score_map.get("technical_analysis", 0.5)
        l3 = score_map.get("cultural_context", 0.5)
        l4 = score_map.get("critical_interpretation", 0.5)
        l5 = score_map.get("philosophical_aesthetic", 0.5)

        # Rule 1: L5 vs L1 divergence → reinterpret visual perception
        if abs(l5 - l1) > 0.3:
            signals.append(CrossLayerSignal(
                source_layer="L5",
                target_layer="L1",
                signal_type=SignalType.REINTERPRET,
                message=(
                    f"L5 ({l5:.3f}) and L1 ({l1:.3f}) diverge by {abs(l5-l1):.3f}. "
                    f"Re-evaluate visual perception in light of philosophical analysis."
                ),
                strength=min(1.0, abs(l5 - l1)),
            ))

        # Rule 2: L5 vs L2 divergence → reinterpret technique
        if abs(l5 - l2) > 0.3:
            signals.append(CrossLayerSignal(
                source_layer="L5",
                target_layer="L2",
                signal_type=SignalType.REINTERPRET,
                message=(
                    f"L5 ({l5:.3f}) and L2 ({l2:.3f}) diverge by {abs(l5-l2):.3f}. "
                    f"Re-evaluate technical analysis with philosophical context."
                ),
                strength=min(1.0, abs(l5 - l2)),
            ))

        # Rule 3: Low cultural but high philosophical → conflict
        if l3 < 0.4 and l5 > 0.8:
            signals.append(CrossLayerSignal(
                source_layer="L5",
                target_layer="L3",
                signal_type=SignalType.CONFLICT,
                message=(
                    f"L3 cultural ({l3:.3f}) is low but L5 philosophical ({l5:.3f}) is high. "
                    f"Cultural grounding may need reexamination."
                ),
                strength=0.8,
            ))

        # Rule 4: L4 vs L1 divergence → evidence gap
        if abs(l4 - l1) > 0.25:
            signals.append(CrossLayerSignal(
                source_layer="L4",
                target_layer="L1",
                signal_type=SignalType.EVIDENCE_GAP,
                message=(
                    f"L4 interpretation ({l4:.3f}) and L1 visual ({l1:.3f}) "
                    f"diverge. Visual evidence may be insufficient."
                ),
                strength=min(1.0, abs(l4 - l1)),
            ))

        # Rule 5: Both L5 and L3 high → confirmation
        if l5 > 0.7 and l3 > 0.7:
            signals.append(CrossLayerSignal(
                source_layer="L5",
                target_layer="L3",
                signal_type=SignalType.CONFIRMATION,
                message=(
                    f"L5 ({l5:.3f}) confirms L3 ({l3:.3f}) cultural grounding."
                ),
                strength=min(l5, l3),
            ))

        return signals

    # ------------------------------------------------------------------
    # Layer 1b: FixItPlan generation
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_fix_it_plan(
        scored_candidates: list[CandidateScore],
    ) -> "FixItPlan | None":
        """Generate a targeted FixItPlan from low-scoring dimensions.

        Examines the best candidate's dimension scores and creates
        repair instructions for dimensions scoring below 6.0 (0.6).
        """
        from app.prototype.agents.fix_it_plan import FixItem, FixItPlan

        if not scored_candidates:
            return None

        best = scored_candidates[0]
        low_items: list[FixItem] = []
        source_scores: dict[str, float] = {}

        # Layer dimension → L-label mapping
        dim_to_label = {
            "visual_perception": "L1",
            "technical_analysis": "L2",
            "cultural_context": "L3",
            "critical_interpretation": "L4",
            "philosophical_aesthetic": "L5",
        }

        # Layer → prompt fix suggestions
        fix_suggestions = {
            "L1": ("weak visual composition", "improve visual clarity, sharper details, better composition"),
            "L2": ("poor technique execution", "refine brushwork technique, improve material rendering"),
            "L3": ("insufficient cultural grounding", "strengthen cultural symbolism and tradition-specific elements"),
            "L4": ("lacks critical depth", "add deeper narrative meaning, symbolic interpretation"),
            "L5": ("weak philosophical resonance", "enhance aesthetic philosophy, evoke contemplative quality"),
        }

        # Layer → mask region hints
        mask_hints = {
            "L1": "full",
            "L2": "foreground",
            "L3": "centre",
            "L4": "upper_third",
            "L5": "full",
        }

        priority = 1
        for ds in best.dimension_scores:
            source_scores[ds.dimension] = ds.score
            if ds.score < 0.6:
                label = dim_to_label.get(ds.dimension, "L1")
                issue, delta = fix_suggestions.get(label, ("low score", "improve quality"))
                low_items.append(FixItem(
                    target_layer=label,
                    issue=issue,
                    prompt_delta=delta,
                    mask_region_hint=mask_hints.get(label, "full"),
                    reference_suggestion="",
                    priority=priority,
                ))
                priority += 1

        if not low_items:
            return None

        strategy = "full_regenerate" if len(low_items) >= 3 else "targeted_inpaint"
        estimated_improvement = min(0.3, 0.1 * len(low_items))

        return FixItPlan(
            items=low_items,
            overall_strategy=strategy,
            estimated_improvement=estimated_improvement,
            source_scores=source_scores,
        )

    # ------------------------------------------------------------------
    # Layer 1c: Evidence gap detection
    # ------------------------------------------------------------------

    @staticmethod
    def _check_evidence_gaps(
        scored_candidates: list[CandidateScore],
        evidence_coverage: float,
        tradition: str,
    ) -> "NeedMoreEvidence | None":
        """Check if Critic findings indicate evidence gaps.

        Returns NeedMoreEvidence if:
        - There are dimensions scoring below 0.5 AND
        - Evidence coverage is below 0.7

        Returns None if evidence is sufficient or scores are acceptable.
        """
        from app.prototype.agents.need_more_evidence import NeedMoreEvidence

        # Don't trigger if coverage is already high
        if evidence_coverage >= 0.7:
            return None

        if not scored_candidates:
            return None

        best = scored_candidates[0]
        dim_to_label = {
            "visual_perception": "L1",
            "technical_analysis": "L2",
            "cultural_context": "L3",
            "critical_interpretation": "L4",
            "philosophical_aesthetic": "L5",
        }

        gaps: list[str] = []
        target_layers: list[str] = []
        suggested_queries: list[str] = []

        for ds in best.dimension_scores:
            if ds.score < 0.5:
                label = dim_to_label.get(ds.dimension, ds.dimension)
                target_layers.append(label)
                gaps.append(f"{label} ({ds.dimension}): score {ds.score:.3f} — evidence insufficient")

                # Generate search queries based on the weak layer
                if ds.dimension == "cultural_context":
                    suggested_queries.append(f"{tradition} cultural symbolism")
                    suggested_queries.append(f"{tradition} tradition meaning")
                elif ds.dimension == "technical_analysis":
                    suggested_queries.append(f"{tradition} technique brushwork")
                elif ds.dimension == "visual_perception":
                    suggested_queries.append(f"{tradition} visual composition")
                elif ds.dimension == "philosophical_aesthetic":
                    suggested_queries.append(f"{tradition} aesthetic philosophy")

        if not gaps:
            return None

        # Determine urgency based on number of gaps and coverage
        if len(gaps) >= 3 or evidence_coverage < 0.3:
            urgency = "high"
        elif len(gaps) >= 2 or evidence_coverage < 0.5:
            urgency = "medium"
        else:
            urgency = "low"

        return NeedMoreEvidence(
            gaps=gaps,
            suggested_queries=suggested_queries,
            target_layers=target_layers,
            urgency=urgency,
            evidence_coverage_before=evidence_coverage,
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _has_any_api_key(self) -> bool:
        """Check if any supported LLM API key is available."""
        key_vars = [
            "DEEPSEEK_API_KEY",
            "GOOGLE_API_KEY",
            "GEMINI_API_KEY",
            "OPENAI_API_KEY",
            "DEEPINFRA_API_KEY",
        ]
        return any(os.environ.get(k) for k in key_vars)

    def _escalate_dimensions(
        self,
        dim_scores: list[DimensionScore],
        candidate: dict,
        critique_input: CritiqueInput,
    ) -> list[DimensionScore]:
        """Selectively escalate dimensions to Agent evaluation.

        Returns a new list of DimensionScore with escalated dims replaced.
        """
        # Build LayerStates from rule scores
        layer_states = init_layer_states()
        for ds in dim_scores:
            ls = layer_states.get(ds.dimension)
            if ls:
                ls.record_score(ds.score)
                # Low confidence from rule scoring
                ls.confidence = 0.3 if ds.score < 0.5 else 0.6

        # Determine which dims to escalate, ranked by priority
        escalation_candidates: list[tuple[float, str]] = []
        for dim_id, ls in layer_states.items():
            weight = self._config.weights.get(dim_id, 0.2)
            if ls.should_escalate(weight=weight):
                prio = ls.priority(weight)
                escalation_candidates.append((prio, dim_id))

        # Sort by priority descending, take top max_escalations
        escalation_candidates.sort(reverse=True)
        dims_to_escalate = [
            dim_id for _, dim_id in escalation_candidates[:self._max_escalations]
        ]

        if not dims_to_escalate:
            return dim_scores

        # Run Agent evaluations
        agent_results = self._run_agent_evaluations(
            dims_to_escalate=dims_to_escalate,
            layer_states=layer_states,
            candidate=candidate,
            critique_input=critique_input,
        )

        # Merge: replace rule scores with Agent scores where successful
        dim_score_map = {ds.dimension: ds for ds in dim_scores}
        for dim_id, agent_result in agent_results.items():
            if agent_result.fallback_used:
                continue
            if agent_result.score <= 0:
                continue

            rule_score = dim_score_map[dim_id].score
            # Merge: weighted average (Agent gets higher weight)
            merged_score = 0.3 * rule_score + 0.7 * agent_result.score
            merged_rationale = (
                f"rule={rule_score:.3f}; agent={agent_result.score:.3f} "
                f"(model={agent_result.model_used}, tools={agent_result.tool_calls_made}); "
                f"merged={merged_score:.3f}"
            )

            dim_score_map[dim_id] = DimensionScore(
                dimension=dim_id,
                score=max(0.0, min(1.0, merged_score)),
                rationale=merged_rationale,
            )

            self._total_escalations += 1
            self._total_tool_calls += agent_result.tool_calls_made

            # Track re-plans: Agent significantly changed the score
            if abs(agent_result.score - rule_score) > 0.15:
                self._total_re_plans += 1

        return [dim_score_map[dim] for dim in DIMENSIONS]

    def _escalate_serial(
        self,
        dim_scores: list[DimensionScore],
        candidate: dict,
        critique_input: CritiqueInput,
    ) -> list[DimensionScore]:
        """Progressive deepening: evaluate L1→L2→L3→L4→L5 serially.

        Each layer reads the analysis text of completed prior layers,
        building cumulative context for deeper understanding.
        """
        # Build LayerStates from rule scores
        layer_states = init_layer_states()
        for ds in dim_scores:
            ls = layer_states.get(ds.dimension)
            if ls:
                ls.record_score(ds.score)
                ls.confidence = 0.3 if ds.score < 0.5 else 0.6

        # Build shared resources with layer_states for read_layer_analysis
        tool_registry = build_critic_tool_registry(
            scout_service=self._scout_service,
            layer_states=layer_states,
        )
        model_router = ModelRouter()

        runtime = AgentRuntime(
            tool_registry=tool_registry,
            model_router=model_router,
            max_steps=self._max_agent_steps,
        )

        # Build candidate/evidence summaries
        candidate_summary = (
            f"Prompt: {candidate.get('prompt', 'N/A')}\n"
            f"Model: {candidate.get('model_ref', 'N/A')}\n"
            f"Steps: {candidate.get('steps', 'N/A')}\n"
            f"Sampler: {candidate.get('sampler', 'N/A')}"
        )
        evidence = critique_input.evidence
        evidence_parts = []
        terms = evidence.get("terminology_hits", [])
        if terms:
            evidence_parts.append(f"Terminology hits: {len(terms)}")
        samples = evidence.get("sample_matches", [])
        if samples:
            evidence_parts.append(f"Sample matches: {len(samples)}")
        taboos = evidence.get("taboo_violations", [])
        if taboos:
            evidence_parts.append(f"Taboo violations: {len(taboos)}")
        evidence_summary = "; ".join(evidence_parts) if evidence_parts else "(no evidence)"

        # L1→L5 serial evaluation
        _DIM_ORDER = [
            "visual_perception",
            "technical_analysis",
            "cultural_context",
            "critical_interpretation",
            "philosophical_aesthetic",
        ]
        dim_score_map = {ds.dimension: ds for ds in dim_scores}
        image_url = candidate.get("image_url") or candidate.get("image_path")

        for dim_id in _DIM_ORDER:
            ls = layer_states.get(dim_id)
            if not ls:
                continue
            weight = self._config.weights.get(dim_id, 0.2)
            if not ls.should_escalate(weight=weight):
                continue

            # Build accumulated context from prior layers
            accumulated = ls.get_accumulated_context(
                all_states=layer_states, up_to=dim_id,
            )

            # Augment evidence summary with prior layer context
            full_evidence = evidence_summary
            if accumulated:
                full_evidence = f"{evidence_summary}\n\n### Prior Layer Analyses\n{accumulated}"

            ctx = AgentContext(
                task_id=critique_input.task_id,
                layer_id=dim_id,
                layer_label=_LAYER_LABELS.get(dim_id, dim_id),
                subject=critique_input.subject,
                cultural_tradition=critique_input.cultural_tradition,
                candidate_summary=candidate_summary,
                evidence_summary=full_evidence,
                layer_state=ls,
                image_url=image_url,
            )

            try:
                agent_result = self._run_async(runtime.evaluate(ctx))
            except Exception as exc:  # noqa: BLE001
                logger.error("Serial Agent evaluation failed for %s: %s", dim_id, exc)
                agent_result = AgentResult(layer_id=dim_id, fallback_used=True)

            if not agent_result.fallback_used and agent_result.score > 0:
                # Store analysis text for downstream layers
                ls.analysis_text = agent_result.rationale or ""

                rule_score = dim_score_map[dim_id].score
                merged_score = 0.3 * rule_score + 0.7 * agent_result.score
                merged_rationale = (
                    f"rule={rule_score:.3f}; agent={agent_result.score:.3f} "
                    f"(model={agent_result.model_used}, tools={agent_result.tool_calls_made}); "
                    f"merged={merged_score:.3f}; mode=progressive"
                )
                dim_score_map[dim_id] = DimensionScore(
                    dimension=dim_id,
                    score=max(0.0, min(1.0, merged_score)),
                    rationale=merged_rationale,
                )
                self._total_escalations += 1
                self._total_tool_calls += agent_result.tool_calls_made
                if abs(agent_result.score - rule_score) > 0.15:
                    self._total_re_plans += 1
            else:
                # Fallback: still store rule analysis for downstream
                ls.analysis_text = (
                    f"Rule-based score: {ls.score:.3f}. "
                    f"Rationale: {dim_score_map[dim_id].rationale}"
                )

        return [dim_score_map[dim] for dim in DIMENSIONS]

    def _run_agent_evaluations(
        self,
        dims_to_escalate: list[str],
        layer_states: dict[str, LayerState],
        candidate: dict,
        critique_input: CritiqueInput,
    ) -> dict[str, AgentResult]:
        """Run AgentRuntime.evaluate() for selected dimensions.

        Handles sync/async boundary safely.
        """
        results: dict[str, AgentResult] = {}

        # Build shared resources
        tool_registry = build_critic_tool_registry(
            scout_service=self._scout_service,
            layer_states=layer_states,
        )
        model_router = ModelRouter()

        runtime = AgentRuntime(
            tool_registry=tool_registry,
            model_router=model_router,
            max_steps=self._max_agent_steps,
        )

        # Build candidate summary
        candidate_summary = (
            f"Prompt: {candidate.get('prompt', 'N/A')}\n"
            f"Model: {candidate.get('model_ref', 'N/A')}\n"
            f"Steps: {candidate.get('steps', 'N/A')}\n"
            f"Sampler: {candidate.get('sampler', 'N/A')}"
        )

        # Build evidence summary
        evidence = critique_input.evidence
        evidence_parts = []
        terms = evidence.get("terminology_hits", [])
        if terms:
            evidence_parts.append(f"Terminology hits: {len(terms)}")
        samples = evidence.get("sample_matches", [])
        if samples:
            evidence_parts.append(f"Sample matches: {len(samples)}")
        taboos = evidence.get("taboo_violations", [])
        if taboos:
            evidence_parts.append(f"Taboo violations: {len(taboos)}")
        evidence_summary = "; ".join(evidence_parts) if evidence_parts else "(no evidence)"

        async def _run_all() -> dict[str, AgentResult]:
            dim_results: dict[str, AgentResult] = {}
            for dim_id in dims_to_escalate:
                # VLM layers (L1/L2) need image_url
                image_url = candidate.get("image_url") or candidate.get("image_path")
                ctx = AgentContext(
                    task_id=critique_input.task_id,
                    layer_id=dim_id,
                    layer_label=_LAYER_LABELS.get(dim_id, dim_id),
                    subject=critique_input.subject,
                    cultural_tradition=critique_input.cultural_tradition,
                    candidate_summary=candidate_summary,
                    evidence_summary=evidence_summary,
                    layer_state=layer_states[dim_id],
                    image_url=image_url,
                )
                try:
                    result = await runtime.evaluate(ctx)
                except Exception as exc:  # noqa: BLE001
                    logger.error("Agent evaluation failed for %s: %s", dim_id, exc)
                    result = AgentResult(layer_id=dim_id, fallback_used=True)
                dim_results[dim_id] = result
            return dim_results

        results = self._run_async(_run_all())
        return results

    @staticmethod
    def _run_async(coro: Any) -> Any:
        """Run an async coroutine from sync context, handling existing event loops."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop is not None and loop.is_running():
            # Already inside an event loop — use thread executor
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result(timeout=60)
        else:
            return asyncio.run(coro)
