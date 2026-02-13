#!/usr/bin/env python3
"""Validation script for Layer 1-2 three-tier architecture upgrade.

Tests:
- EvidencePack serialization roundtrip
- to_prompt_context() structured output
- FixItPlan generation and consumption
- NeedMoreEvidence gap detection
- TrajectoryRecord serialization roundtrip
- TrajectoryRecorder record/finish/load cycle
- FAISS trajectory index (if available)
- Draft backward compatibility (no EvidencePack → legacy path)
- Orchestrator integration smoke test (mock provider)
"""

from __future__ import annotations

import json
import sys
import tempfile
import time
from pathlib import Path

# Ensure project root is on path
_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_ROOT))

PASS = 0
FAIL = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        msg = f"  ❌ {name}"
        if detail:
            msg += f" — {detail}"
        print(msg)


# =========================================================================
# 1. EvidencePack
# =========================================================================
print("\n=== Layer 1a: EvidencePack ===")

from app.prototype.tools.evidence_pack import (
    CompositionReference,
    EvidencePack,
    StyleConstraint,
    TabooConstraint,
    TerminologyAnchor,
)

pack = EvidencePack(
    subject="misty mountain landscape",
    tradition="chinese_xieyi",
    anchors=[
        TerminologyAnchor(
            term="披麻皴",
            definition="Hemp-fiber texture stroke technique",
            usage_hint="use for texture description",
            source="terms_v1_chinese_xieyi",
            confidence=1.0,
            l_levels=["L2", "L3"],
        ),
        TerminologyAnchor(
            term="留白",
            definition="Intentional empty space",
            usage_hint="use for composition guidance",
            source="terms_v1_chinese_xieyi",
            confidence=0.9,
            l_levels=["L1", "L5"],
        ),
    ],
    compositions=[
        CompositionReference(
            description="留白 asymmetric balance",
            spatial_strategy="asymmetric_balance",
            example_prompt_fragment="sparse composition with empty space",
        ),
    ],
    styles=[
        StyleConstraint(
            attribute="brush_texture",
            value="dry brush with visible fiber strokes on rice paper",
            tradition_source="chinese_xieyi",
        ),
    ],
    taboos=[
        TabooConstraint(
            description="avoid photorealistic rendering",
            severity="medium",
            tradition_source="chinese_xieyi",
        ),
    ],
    coverage=0.72,
)

# Serialization roundtrip
d = pack.to_dict()
pack2 = EvidencePack.from_dict(d)
d2 = pack2.to_dict()
check("EvidencePack roundtrip", json.dumps(d, sort_keys=True) == json.dumps(d2, sort_keys=True))

# to_prompt_context() structured output
ctx = pack.to_prompt_context()
check("to_prompt_context() non-empty", len(ctx) > 0)
check("to_prompt_context() has ≥3 sections", ctx.count("\n") >= 2, f"sections={ctx.count(chr(10))+1}")
check("to_prompt_context() includes terminology", "披麻皴" in ctx)
check("to_prompt_context() includes composition", "sparse composition" in ctx)
check("to_prompt_context() includes style", "brush_texture" in ctx)
check("to_prompt_context() includes taboo", "avoid" in ctx.lower() or "Avoid" in ctx)

# Negative prompt additions
neg = pack.get_negative_prompt_additions()
check("get_negative_prompt_additions()", len(neg) >= 1)

# =========================================================================
# 2. FixItPlan
# =========================================================================
print("\n=== Layer 1b: FixItPlan ===")

from app.prototype.agents.fix_it_plan import FixItem, FixItPlan

plan = FixItPlan(
    items=[
        FixItem(
            target_layer="L2",
            issue="poor technique execution",
            prompt_delta="refine brushwork, improve material rendering",
            mask_region_hint="foreground",
            reference_suggestion="",
            priority=1,
        ),
        FixItem(
            target_layer="L3",
            issue="insufficient cultural grounding",
            prompt_delta="add traditional symbolism, cultural motifs",
            mask_region_hint="centre",
            reference_suggestion="",
            priority=2,
        ),
    ],
    overall_strategy="targeted_inpaint",
    estimated_improvement=0.15,
    source_scores={"visual_perception": 0.7, "technical_analysis": 0.4, "cultural_context": 0.3},
)

# Serialization roundtrip
fd = plan.to_dict()
plan2 = FixItPlan.from_dict(fd)
fd2 = plan2.to_dict()
check("FixItPlan roundtrip", json.dumps(fd, sort_keys=True) == json.dumps(fd2, sort_keys=True))

# Prompt delta
delta = plan.to_prompt_delta()
check("to_prompt_delta() non-empty", len(delta) > 0)
check("to_prompt_delta() contains fix terms", "brushwork" in delta)

# Mask hint
mask = plan.get_mask_hint()
check("get_mask_hint() returns highest priority", mask == "foreground")

# Negative additions
negs = plan.get_negative_additions()
check("get_negative_additions()", len(negs) >= 2)

# =========================================================================
# 3. NeedMoreEvidence
# =========================================================================
print("\n=== Layer 1c: NeedMoreEvidence ===")

from app.prototype.agents.need_more_evidence import NeedMoreEvidence

nme = NeedMoreEvidence(
    gaps=["L3 (cultural_context): score 0.300 — evidence insufficient"],
    suggested_queries=["chinese_xieyi cultural symbolism"],
    target_layers=["L3"],
    urgency="medium",
    evidence_coverage_before=0.45,
)

nd = nme.to_dict()
nme2 = NeedMoreEvidence.from_dict(nd)
nd2 = nme2.to_dict()
check("NeedMoreEvidence roundtrip", json.dumps(nd, sort_keys=True) == json.dumps(nd2, sort_keys=True))

# Test CriticLLM._check_evidence_gaps
from app.prototype.agents.critic_types import CandidateScore, DimensionScore

mock_scored = [CandidateScore(
    candidate_id="test-001",
    dimension_scores=[
        DimensionScore(dimension="visual_perception", score=0.7, rationale="ok"),
        DimensionScore(dimension="technical_analysis", score=0.4, rationale="low"),
        DimensionScore(dimension="cultural_context", score=0.3, rationale="very low"),
        DimensionScore(dimension="critical_interpretation", score=0.6, rationale="ok"),
        DimensionScore(dimension="philosophical_aesthetic", score=0.5, rationale="mid"),
    ],
    weighted_total=0.5,
    risk_tags=[],
    gate_passed=False,
    rejected_reasons=["low"],
)]

from app.prototype.agents.critic_llm import CriticLLM

# Low coverage + low scores → should trigger
nme_result = CriticLLM._check_evidence_gaps(mock_scored, 0.3, "chinese_xieyi")
check("NeedMoreEvidence triggers on low coverage + low scores", nme_result is not None)
if nme_result:
    check("NeedMoreEvidence urgency is high/medium", nme_result.urgency in ("high", "medium"))
    check("NeedMoreEvidence has suggested queries", len(nme_result.suggested_queries) > 0)

# High coverage → should NOT trigger
nme_high = CriticLLM._check_evidence_gaps(mock_scored, 0.8, "chinese_xieyi")
check("NeedMoreEvidence does NOT trigger on high coverage", nme_high is None)

# Test FixItPlan generation
fix_result = CriticLLM._generate_fix_it_plan(mock_scored)
check("FixItPlan generated from low scores", fix_result is not None)
if fix_result:
    check("FixItPlan has items for low dims", len(fix_result.items) >= 2)
    check("FixItPlan prompt_delta non-empty", len(fix_result.to_prompt_delta()) > 0)

# =========================================================================
# 4. TrajectoryRecord
# =========================================================================
print("\n=== Layer 2: TrajectoryRecord ===")

from app.prototype.trajectory.trajectory_types import (
    CriticFindings as TrajCriticFindings,
    DecisionLog as TrajDecisionLog,
    DraftPlan as TrajDraftPlan,
    PromptTrace as TrajPromptTrace,
    RoundRecord,
    TrajectoryRecord,
)

record = TrajectoryRecord(
    subject="misty mountain",
    tradition="chinese_xieyi",
    evidence_pack_dict=pack.to_dict(),
    rounds=[
        RoundRecord(
            round_num=1,
            draft_plan=TrajDraftPlan(
                prompt_trace=TrajPromptTrace(
                    raw_prompt="misty mountain",
                    enhanced_prompt="A chinese xieyi artwork: misty mountain, 披麻皴",
                    prompt_hash="abc123",
                    model_ref="mock",
                ),
                provider="mock",
                generation_params={"seed": 42, "steps": 15},
                latency_ms=100,
                n_candidates=4,
            ),
            critic_findings=TrajCriticFindings(
                layer_scores={
                    "visual_perception": 0.7,
                    "technical_analysis": 0.5,
                    "cultural_context": 0.6,
                    "critical_interpretation": 0.5,
                    "philosophical_aesthetic": 0.4,
                },
                weighted_score=0.54,
            ),
            decision=TrajDecisionLog(
                action="accept",
                reason="above threshold",
                round_num=1,
                threshold=0.5,
            ),
        ),
    ],
    final_score=0.54,
    final_action="accept",
    total_latency_ms=500,
    total_cost=0.0,
)

# Serialization roundtrip
rd = record.to_dict()
record2 = TrajectoryRecord.from_dict(rd)
rd2 = record2.to_dict()
check("TrajectoryRecord roundtrip", json.dumps(rd, sort_keys=True) == json.dumps(rd2, sort_keys=True))

# Search text
st = record.to_search_text()
check("to_search_text() non-empty", len(st) > 0)
check("to_search_text() includes subject", "misty mountain" in st)
check("to_search_text() includes action", "accept" in st)

# =========================================================================
# 5. TrajectoryRecorder
# =========================================================================
print("\n=== Layer 2: TrajectoryRecorder ===")

from app.prototype.trajectory.trajectory_recorder import TrajectoryRecorder

with tempfile.TemporaryDirectory() as tmpdir:
    recorder = TrajectoryRecorder(storage_dir=tmpdir)

    check("Recorder inactive initially", not recorder.active)

    recorder.start("test subject", "western_academic", {"test": True})
    check("Recorder active after start", recorder.active)

    recorder.record_draft(
        TrajDraftPlan(
            prompt_trace=TrajPromptTrace(
                raw_prompt="test",
                enhanced_prompt="test enhanced",
                prompt_hash="",
                model_ref="mock",
            ),
            provider="mock",
            latency_ms=50,
            n_candidates=4,
        ),
        round_num=1,
    )

    recorder.record_critic(
        TrajCriticFindings(
            layer_scores={"visual_perception": 0.8},
            weighted_score=0.8,
        ),
        round_num=1,
    )

    recorder.record_decision(
        TrajDecisionLog(action="accept", reason="good", round_num=1),
        round_num=1,
    )

    result = recorder.finish(
        final_score=0.8,
        final_action="accept",
        total_latency_ms=200,
    )

    check("Recorder finish returns TrajectoryRecord", result is not None)
    check("Trajectory has 1 round", len(result.rounds) == 1)
    check("Trajectory final_score correct", result.final_score == 0.8)
    check("Trajectory saved to disk", recorder.count() == 1)

    # Load back
    loaded = recorder.load_all()
    check("load_all() returns 1 record", len(loaded) == 1)
    check("Loaded record matches", loaded[0].trajectory_id == result.trajectory_id)

    # High score filter
    high = recorder.get_high_score_trajectories(min_score=5.0)
    check("get_high_score_trajectories(5.0) returns 1", len(high) == 1)
    low = recorder.get_high_score_trajectories(min_score=9.0)
    check("get_high_score_trajectories(9.0) returns 0", len(low) == 0)

# =========================================================================
# 6. FAISS trajectory index (if available)
# =========================================================================
print("\n=== Layer 2: FAISS Trajectory Index ===")

try:
    from app.prototype.tools.faiss_index_service import FaissIndexService
    svc = FaissIndexService()
    if svc.available:
        n = svc.build_trajectory_index([record])
        check("build_trajectory_index() returns 1", n == 1)

        results = svc.search_trajectories("misty mountain chinese", top_k=1)
        check("search_trajectories() returns results", len(results) >= 1)
        if results:
            check("search result is correct record", results[0].subject == "misty mountain")
    else:
        print("  ⏭️  FAISS not available, skipping trajectory index tests")
except ImportError:
    print("  ⏭️  FAISS not installed, skipping trajectory index tests")

# =========================================================================
# 7. Draft backward compatibility
# =========================================================================
print("\n=== Backward Compatibility ===")

from app.prototype.agents.draft_agent import DraftAgent
from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.draft_types import DraftInput

cfg = DraftConfig(provider="mock", n_candidates=2, seed_base=42)
agent = DraftAgent(config=cfg)

# Old path: no evidence_pack
old_input = DraftInput(
    task_id="compat-test-001",
    subject="bamboo forest",
    cultural_tradition="chinese_xieyi",
    evidence={
        "terminology_hits": [{"term": "竹", "confidence": 1.0}],
        "taboo_violations": [],
    },
    config=cfg,
)
old_output = agent.run(old_input)
check("Legacy path (no EvidencePack) works", old_output.success)

# New path: with evidence_pack
new_output = agent.run(old_input, evidence_pack=pack)
check("New path (with EvidencePack) works", new_output.success)
if new_output.candidates:
    check("EvidencePack enriches prompt", "披麻皴" in new_output.candidates[0].prompt)

# =========================================================================
# 8. Scout EvidencePack integration
# =========================================================================
print("\n=== Scout → EvidencePack Integration ===")

from app.prototype.tools.scout_service import ScoutService

scout = ScoutService(search_mode="auto")
evidence = scout.gather_evidence("pine tree landscape", "chinese_xieyi")
ep = scout.build_evidence_pack("pine tree landscape", "chinese_xieyi", evidence)

check("build_evidence_pack() returns EvidencePack", ep is not None)
check("EvidencePack has subject", ep.subject == "pine tree landscape")
check("EvidencePack has tradition", ep.tradition == "chinese_xieyi")
check("EvidencePack coverage ≥ 0", ep.coverage >= 0)
check("EvidencePack has compositions", len(ep.compositions) >= 1)
check("EvidencePack has styles", len(ep.styles) >= 1)

# =========================================================================
# 9. E2E Orchestrator smoke test (mock)
# =========================================================================
print("\n=== E2E Orchestrator Smoke Test (mock) ===")

from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
from app.prototype.pipeline.pipeline_types import PipelineInput

orch = PipelineOrchestrator(
    draft_config=DraftConfig(provider="mock", n_candidates=2, seed_base=42),
    enable_agent_critic=False,
    enable_archivist=False,
)

pi = PipelineInput(
    task_id=f"validate-trajectory-{int(time.time())}",
    subject="lotus flower",
    cultural_tradition="chinese_gongbi",
)

output = orch.run_sync(pi)
check("E2E pipeline completes successfully", output.success)
check("E2E pipeline has stages", len(output.stages) > 0)

# Check that trajectory was recorded
recorder_check = TrajectoryRecorder()
count = recorder_check.count()
check("Trajectory file created after E2E run", count >= 1, f"count={count}")

# =========================================================================
# Summary
# =========================================================================
print(f"\n{'='*50}")
print(f"TOTAL: {PASS + FAIL} | PASS: {PASS} | FAIL: {FAIL}")
if FAIL > 0:
    print("❌ SOME TESTS FAILED")
    sys.exit(1)
else:
    print("✅ ALL TESTS PASSED")
    sys.exit(0)
