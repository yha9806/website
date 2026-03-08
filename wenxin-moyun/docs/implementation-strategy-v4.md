# VULCA Implementation Strategy v4 -- From Canvas to Quality Intelligence Platform

> Date: 2026-03-07 (updated 2026-03-08)
> Author: Yu Haorui (@yhryzy)
> Status: Phase 1-4 COMPLETE, Phase 5 PARTIAL -- supersedes `vulca-roadmap-v3.md` (M0-M8 completed)
> Related: `strategic-pivot-nocode-2026-03-07.md` (vision), `competitive-analysis-2026.md` (market)
> Research: `self-evolution-research-2026.md` (40+ projects/papers on skill marketplaces + agent RL)

---

## 1. Where We Are: Foundation Complete

### 1.1 Completed Assets (M0-M8, 2026-03-04 to 2026-03-06)

| Layer | Asset | Status | Key Files |
|-------|-------|--------|-----------|
| **Engine** | LangGraph 5-template Agent cluster | Done | `graph/`, `orchestrator/`, `pipeline/` |
| **Engine** | 6 Agent nodes (Scout/Router/Draft/Critic/Queen/Archivist) | Done | `agents/*.py` (35 files) |
| **Engine** | Cultural Pipeline Router (9 traditions x 3 variants) | Done | `cultural_pipelines/` |
| **Engine** | VLM Critic (Gemini, L1-L5 scoring) | Done | `agents/vlm_critic.py` |
| **Engine** | Parallel Dimension Scorer | Done | `agents/parallel_scorer.py` |
| **Engine** | Dynamic weights + cross-layer signals | Done | `cultural_pipelines/dynamic_weights.py` |
| **Engine** | Gemini single-stack (NB2 + VLM + LLM) | Done | `agents/model_router.py` |
| **Data** | TRADITION.yaml (10 files + JSON Schema) | Done | `traditions/*.yaml` |
| **Data** | Knowledge base (52 terms, 20 taboos, 30 tasks) | Done | `data/terminology/`, `data/benchmarks/` |
| **API** | REST endpoints (evaluate, identify-tradition) | Done | `api/evaluate_routes.py` |
| **API** | Bearer auth + rate limiting (30 req/min) | Done | `api/auth.py` |
| **API** | SSE event streaming (23 event types) | Done | `api/routes.py` |
| **API** | 7 prototype endpoints (runs, events, templates, agents, topologies) | Done | `api/routes.py` |
| **Frontend** | React Flow Canvas Editor (edit/run/build/explore/compare) | Done | `editor/`, Prototype components |
| **Frontend** | iOS design system (50+ components) | Done | `components/ios/` |
| **Frontend** | i18n (zh/en/ja, 80+ keys) | Done | `src/i18n/` |
| **Frontend** | HITL 4-stage overlay | Done | `HitlOverlay.tsx` |
| **Integrations** | HF Space + CLI + Discord Bot | Done | `integrations/` |
| **Infra** | Cloud Run Dockerfile + CI/CD + storage abstraction | Done | `Dockerfile.cloud`, workflows |
| **Academic** | ACM MM 2026 paper (submit-ready) | Done | `ACMMM2026-AgentLoop/` |
| **Academic** | 480-run ablation dataset (16 conditions) | Done | `unified_ablation_results.json` |

### 1.2 What This Foundation Gives Us

```
Engine:     Scout→Router→Draft→Critic→Queen  (configurable, parallel, HITL-enabled)
Data:       9 traditions, 52 terms, 20 taboos, L1-L5 weights
Interfaces: REST API + SSE + Canvas + CLI + Discord + HF Space
Infra:      Gemini single-key, $0.039/task, Cloud Run ready
Trust:      EMNLP 2025 + ACM MM 2026 (two peer-reviewed publications)
```

### 1.3 What's Missing (the "five gaps" from strategic pivot)

| Gap | Problem | Impact |
|-----|---------|--------|
| **Intent Understanding** | User must manually select tradition + configure params | High barrier, ~10K user ceiling |
| **Process Visibility** | Agent decisions are black-box during NoCode use | Users don't trust results |
| **Feedback Loop** | One-way output, no learning from user behavior | System doesn't improve |
| **Scenario Diversity** | Only cultural evaluation (L1-L5) | Can't handle brand/trend/audience |
| **Community Ecology** | YAML contribution requires understanding L1-L5 framework | Too narrow contributor base |

---

## 2. Strategic Direction: NoCode + Self-Evolving Quality Intelligence

### 2.1 One-Sentence Vision

> "Does your AI output make sense? For your audience, your brand, your culture."

### 2.2 Three Key Decisions

1. **NoCode First**: Users describe intent in natural language; system auto-orchestrates. Flow/Code views available but hidden by default.
2. **Beyond Culture**: L1-L5 becomes one "Skill Pack"; product extends to brand consistency, audience fit, trend match, cross-cultural risk, etc.
3. **Self-Evolution**: User feedback (implicit + explicit) drives continuous improvement. System learns per-user and per-context preferences.

### 2.3 Critical Strategic Decisions (2026-03-07 Update)

#### 2.3.1 App/Desktop vs Website?

**Decision: Stay web, add PWA. Not native app.**

| Factor | Web (PWA) | Native App |
|--------|-----------|------------|
| Dev cost | Current codebase | Rewrite 6-12 months |
| Distribution | URL = instant access | App Store review 1-7 days |
| Updates | Instant deploy | Store review cycle |
| Stage fit | PMF not validated | Post-PMF only |
| Competitor pattern | ComfyUI=Web, n8n=Web, Dify=Web | Only LOVART did native |

The "instability" problem is not the web format itself — it's:
- Render free tier cold start (30s+)
- No proper SaaS backend (free tier DB)
- Too many pages diluting core experience

**Action**: Add PWA manifest + service worker for "install to desktop" capability. Zero new code for native feel.

#### 2.3.2 Website Simplification: 30+ Pages → ~20 Pages

**Current state: 30+ routes, 10,338 lines of page code. Bloated and unfocused.**

**Key insight**: Exhibitions and marketing are NOT waste — exhibitions are real data assets (87 artworks + AI dialogues), marketing pages are the storefront for open source credibility. The problem is redundancy and fragmentation, not existence.

**Three-tier page structure:**

```
TIER 1 — Core Product (navigation bar, always visible):
  /               → Landing: value prop + [Try Online] + [Install] + [GitHub]
  /evaluate       → PRIMARY: NoCode evaluation tool
  /canvas         → POWER USER: React Flow pipeline editor (rename /prototype)
  /models         → Leaderboard + model detail + compare

TIER 2 — Content Assets (navigation bar):
  /exhibitions    → Exhibition list (87 artworks, real data asset)
  /exhibitions/:id → Exhibition detail + artwork pages
  /gallery        → Community showcase
  /knowledge-base → Cultural knowledge browser
  /skills         → Skill marketplace (Phase 5)

TIER 3 — Trust & Conversion (footer links):
  /pricing        → Online vs open-source pricing
  /research       → MERGED: methodology + dataset + papers (was 3 pages)
  /solutions      → MERGED: AI labs + research + museums (was 4 pages)
  /trust          → MERGED: security + data ethics + SOP (was 3 pages)
  /customers      → Customer logos + case studies
  /demo           → Cal.com booking (absorbs /pilot)
  /privacy, /terms → Legal
  /login          → Auth
```

**Deleted (10 pages → content merged elsewhere):**
```
/product         → merged into / (landing page)
/changelog       → moved to GitHub Releases
/pilot           → merged into /demo
/methodology     → merged into /research
/dataset         → merged into /research
/papers          → merged into /research
/solutions/ai-labs    → merged into /solutions (single page with tabs)
/solutions/research   → merged into /solutions
/solutions/museums    → merged into /solutions
/data-ethics     → merged into /trust
/sop             → merged into /trust
/vulca           → merged into /evaluate
```

**Net result: 30+ → ~20 pages. Delete 10, merge 6, keep all valuable content.**

#### 2.3.3 Open Source Changes the Website's Role

**Before open source**: Website = the product itself (only way to use VULCA)
**After open source**: Website = showcase + hosted version + community portal

**Distribution channels (prioritized):**

| Channel | Target User | Barrier | Priority |
|---------|------------|---------|----------|
| **vulcaart.art/evaluate** | Zero-barrier users | None | P0 — already exists |
| **`pip install vulca`** | Python developers | Low | P0 — open source core |
| **`vulca` CLI** | Terminal users | Low | P0 — included in pip |
| **GitHub clone** | Contributors/researchers | Medium | P0 — open source core |
| **Docker** | Self-hosting enterprises | Medium | P1 — Dockerfile exists |
| **HF Space** | ML community | None | P1 — already exists |
| **Desktop App** | Non-technical users | None | P2 — after PMF validation |

**Landing page must include Install section:**
```
┌─────────────────────────────────────────────────┐
│  VULCA — AI Quality Intelligence                │
│                                                 │
│  [Try Online]     [Install]     [GitHub ⭐]      │
│                                                 │
│  $ pip install vulca                            │
│  $ vulca evaluate my-image.png --tradition ja   │
└─────────────────────────────────────────────────┘
```

**Reference: successful open source project websites:**
- n8n.io: product demo + docs + Cloud version + pricing
- Dify.ai: Cloud + docs + template marketplace
- Gradio: online demo + docs + HF integration (lightweight site, heavy PyPI distribution)
- ComfyUI: GitHub README + community Registry (almost no independent website)

#### 2.3.4 NoCode-Everywhere Principle

**NoCode is NOT a separate page. It is the interaction paradigm for the entire product.**

Current problem:
```
/prototype has 5 modes (edit/run/build/explore/compare) — expert tool
/evaluate would be 1 mode (type→result) — beginner tool
= Two completely separate experiences for the same underlying engine
```

Correct approach — **unified progressive disclosure at every touchpoint:**

```
Every interaction starts NoCode:
  /evaluate    → type question → get result → [show flow] → [edit in canvas] → [export code]
  /canvas      → pick template → run → [see result card] → [edit params] → [export code]
  /models      → click model → [quick evaluate with this model] → result card
  /skills      → browse skill → [try it on your image] → result card

The same ResultCard + FlowToggle + CodeExport components appear EVERYWHERE.
NoCode is not a page — it's a layer.
```

**Competitive validation:**
- ComfyUI: Every feature = drag-drop node (one paradigm)
- n8n: Every automation = workflow (one paradigm)
- Dify: Every AI app = builder (one paradigm)
- VULCA current: evaluation in `/prototype`, rankings in `/models`, exhibitions in `/exhibitions` — **no unified paradigm**

#### 2.3.4 Beyond "Just Evaluation"

The evaluation engine is the core, but it surfaces through multiple scenarios:

```
Evaluation Engine (VLMCritic + CulturalRouter + Scout)
    │
    ├── Scenario 1: Quick Check     → "Is this image culturally OK?"      (NoCode)
    ├── Scenario 2: Deep Analysis   → "5-dimension detailed report"       (Canvas)
    ├── Scenario 3: Batch Audit     → "Check 100 images for brand"        (API/CSV)
    ├── Scenario 4: Model Compare   → "Which model generates better?"     (Leaderboard)
    ├── Scenario 5: Learn/Explore   → "Why did it score this way?"        (Knowledge)
    └── Scenario 6: Custom Logic    → "Evaluate with my own criteria"     (Skills)
```

All 6 scenarios use the same engine, same ResultCard, same progressive disclosure.
The product is the engine + multiple lenses, not 30 separate pages.

### 2.4 Progressive Disclosure Architecture

```
Layer 0 -- Natural Language (NoCode, default)
  User types: "Check this image for Japanese market"
  System: auto-selects Skills → executes → returns Result Card
  Toggle: "Show how this was done"

Layer 1 -- Flow View (Low-Code, opt-in)
  User clicks "Show flow" → sees auto-generated pipeline (React Flow)
  Can inspect each step, modify nodes/connections/params
  = Current M3 Canvas, repositioned as inspection layer

Layer 2 -- Code (Developer, opt-in)
  User clicks "Export as code" → gets Python/YAML/API equivalent
  Can write custom Skills, Agents, evaluation logic
  = Current M4 B2B API

Layer 3 -- Framework (Researcher/Contributor)
  Full access to vulca-core source
  Write Skill definitions, run experiments
  = Open-source framework layer
```

---

## 3. New Architecture: Intent Layer on Existing Engine

### 3.1 Architecture Diagram

```
                    ┌──────────────────────────────────────────┐
                    │           NEW: Intent Layer              │
                    │                                          │
User Input ───────►│  IntentAgent ──► ContextBuilder           │
(text + image)     │       │              │                    │
                    │       ▼              ▼                    │
                    │  SkillSelector ──► ConfigTranslator      │
                    │       │              │                    │
                    └───────│──────────────│────────────────────┘
                            │              │
                    ┌───────▼──────────────▼────────────────────┐
                    │      EXISTING: Pipeline Engine            │
                    │                                          │
                    │  PipelineOrchestrator                     │
                    │    Scout → Router → Draft → Critic → Queen│
                    │    (SSE events, HITL, parallel scoring)  │
                    │                                          │
                    └───────┬──────────────────────────────────┘
                            │
                    ┌───────▼──────────────────────────────────┐
                    │      NEW: Output Layer                   │
                    │                                          │
                    │  ResultFormatter ──► Result Card (default)│
                    │       │                                   │
                    │       ├──► Flow View (React Flow, opt-in)│
                    │       └──► Code View (export, opt-in)    │
                    │                                          │
                    │  FeedbackCollector ──► Preference Model   │
                    └──────────────────────────────────────────┘
```

### 3.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Intent parsing | Single LLM call (Gemini) | Fast (~1-2s), cheap ($0.001), good enough |
| Skill selection | Rules 90% + LLM 10% | Speed (<10ms rules), predictability, explainability |
| Pipeline engine | Reuse PipelineOrchestrator | Not a rewrite; add translation layer on top |
| Multi-agent orchestration? | No — single IntentAgent + rules | Multi-agent coordination cost > benefit at this stage |
| Flow visualization | Auto-generate from SSE events | Already have SSE stream + React Flow; just connect them |
| Feedback storage | Append-only event log | Simple, auditable, feeds preference model later |

### 3.3 Component Details

#### IntentAgent (NEW)

```python
# app/prototype/intent/intent_agent.py
class IntentAgent:
    """Parse natural language into structured evaluation intent.

    Single Gemini call with structured output (JSON mode).
    ~1-2 seconds, ~$0.001 per call.
    """

    SYSTEM_PROMPT = """You are VULCA's intent parser.
    Given a user's request about evaluating AI-generated content,
    extract structured intent:
    - task_type: evaluate | compare | check_risk | improve | identify
    - content_type: image | video | audio | text
    - target_context: {market, audience, use_case, brand, style}
    - concerns: list of specific user concerns
    - suggested_skills: list from available skill registry
    - confidence: 0-1 how confident you are in the parse

    Available skills: {skills}
    Available traditions: {traditions}
    """

    async def parse(self, user_input: str, image: bytes | None = None) -> Intent:
        # Gemini structured output → Intent dataclass
        ...
```

**Input**: `"Check this image for Japanese market use"` + image bytes
**Output**:
```json
{
  "task_type": "evaluate",
  "content_type": "image",
  "target_context": {
    "market": "japan",
    "audience": "general",
    "use_case": "marketing"
  },
  "concerns": ["cultural_appropriateness", "aesthetic_fit"],
  "suggested_skills": ["tradition_identifier", "taboo_detector", "cultural_evaluation"],
  "suggested_tradition": "japanese_traditional",
  "confidence": 0.92
}
```

#### SkillSelector (NEW)

```python
# app/prototype/intent/skill_selector.py
class SkillSelector:
    """Select and configure skills based on parsed intent.

    Rule-based primary selection + LLM fallback for ambiguous cases.
    """

    def select(self, intent: Intent) -> SkillPlan:
        # Step 1: Deterministic rule matching (fast, predictable)
        skills = self._rule_match(intent)

        # Step 2: If rules don't match enough, ask LLM
        if intent.confidence < 0.7 or len(skills) < 2:
            extra = self._llm_suggest(intent, skills)
            skills.extend(extra)

        # Step 3: Compute weights from context
        weights = self._compute_weights(intent, skills)

        # Step 4: Map to pipeline configuration
        return SkillPlan(skills=skills, weights=weights, tradition=intent.suggested_tradition)

    def _rule_match(self, intent: Intent) -> list[Skill]:
        """Hard rules: certain contexts always trigger certain skills."""
        skills = []

        # Cultural context → load tradition Skill Pack
        if intent.suggests_tradition():
            tradition = intent.suggested_tradition
            skills.extend(self.registry.get_pack("traditional_culture", tradition))

        # Market targeting → cultural risk scan
        if intent.target_context.get("market"):
            skills.append(self.registry.get("cross_cultural_risk"))

        # Brand mentioned → brand consistency check
        if "brand" in str(intent.concerns):
            skills.append(self.registry.get("brand_consistency"))

        # Always include basic visual quality
        if not skills:
            skills.append(self.registry.get("visual_quality_basic"))

        return skills
```

#### SkillRegistry (NEW — extends existing ToolRegistry)

```python
# app/prototype/intent/skill_registry.py
class SkillRegistry:
    """Registry of available evaluation skills.

    Extends existing ToolRegistry pattern. Skills can be:
    - Built-in (L1-L5, tradition_identifier, taboo_detector)
    - YAML-defined (skill-packs/*.yaml)
    - User-created (future: natural language → skill)
    """

    def __init__(self):
        self._skills: dict[str, Skill] = {}
        self._packs: dict[str, SkillPack] = {}

    def load_builtin(self):
        """Load built-in skills from existing engine capabilities."""
        # VLMCritic → "cultural_evaluation" skill
        self.register(Skill(
            name="cultural_evaluation",
            description="L1-L5 cultural quality evaluation",
            executor=self._vlm_evaluate,
            input_types=["image"],
            output_types=["scores", "rationales", "risks"],
            tags=["culture", "evaluation", "l1-l5"],
        ))
        # CulturalPipelineRouter → "tradition_identifier" skill
        self.register(Skill(
            name="tradition_identifier",
            description="Identify which cultural tradition an image belongs to",
            executor=self._identify_tradition,
            input_types=["image"],
            output_types=["tradition", "confidence", "weights"],
            tags=["culture", "identification"],
        ))
        # ScoutService → "cultural_evidence" skill
        self.register(Skill(
            name="cultural_evidence",
            description="Gather cultural terminology, taboos, and reference evidence",
            executor=self._gather_evidence,
            input_types=["tradition"],
            output_types=["terms", "taboos", "references"],
            tags=["culture", "knowledge"],
        ))

    def load_yaml_skills(self, directory: str):
        """Load skills from YAML definitions (community-contributed)."""
        for path in Path(directory).glob("*.yaml"):
            skill_def = yaml.safe_load(path.read_text())
            self.register(Skill.from_yaml(skill_def))

    def get_pack(self, pack_name: str, context: str = None) -> list[Skill]:
        """Get a skill pack, optionally with context-specific configuration."""
        ...
```

#### ConfigTranslator (NEW)

```python
# app/prototype/intent/config_translator.py
class ConfigTranslator:
    """Translate SkillPlan into PipelineOrchestrator configuration.

    This is the bridge between the Intent Layer and the existing engine.
    No engine changes needed — just maps skills to existing config objects.
    """

    def translate(self, plan: SkillPlan) -> PipelineConfig:
        # Map tradition → CulturalPipelineRouter route
        if plan.tradition:
            route = CulturalPipelineRouter().route(plan.tradition)
            critic_config = route.critic_config
        else:
            critic_config = CriticConfig(weights=plan.weights)

        # Map skills to orchestrator flags
        enable_vlm = any(s.requires_vlm for s in plan.skills)
        enable_evidence = any(s.name == "cultural_evidence" for s in plan.skills)

        return PipelineConfig(
            critic_config=critic_config,
            draft_config=DraftConfig(provider="nb2", n_candidates=4),
            queen_config=QueenConfig(accept_threshold=0.85),
            enable_parallel_critic=True,
            enable_evidence_loop=enable_evidence,
        )
```

#### MetaOrchestrator (NEW — top-level entry point)

```python
# app/prototype/intent/meta_orchestrator.py
class MetaOrchestrator:
    """Top-level orchestrator: Intent → Skills → Pipeline → Results.

    This is the new default entry point for NoCode users.
    Replaces direct PipelineOrchestrator invocation for Layer 0.
    """

    def __init__(self):
        self.intent_agent = IntentAgent()
        self.skill_selector = SkillSelector()
        self.config_translator = ConfigTranslator()
        self.result_formatter = ResultFormatter()
        self.feedback_collector = FeedbackCollector()

    async def run(self, user_input: str, image: bytes = None) -> EvalResult:
        """Full NoCode evaluation flow."""

        # 1. Parse intent (~1-2s)
        intent = await self.intent_agent.parse(user_input, image)

        # 2. Select skills (<10ms rules, ~1s if LLM fallback)
        skill_plan = self.skill_selector.select(intent)

        # 3. Translate to pipeline config (<1ms)
        pipeline_config = self.config_translator.translate(skill_plan)

        # 4. Execute via existing engine (~30-50s)
        orchestrator = PipelineOrchestrator(**pipeline_config.to_dict())
        pipeline_result = orchestrator.run_sync(PipelineInput(
            subject=user_input,
            tradition=skill_plan.tradition or "default",
        ))

        # 5. Format result card
        result = self.result_formatter.format(pipeline_result, intent, skill_plan)

        # 6. Record for feedback collection
        self.feedback_collector.record_run(result)

        return result

    async def run_stream(self, user_input: str, image: bytes = None):
        """Streaming version: yields SSE events for real-time UI."""
        intent = await self.intent_agent.parse(user_input, image)
        skill_plan = self.skill_selector.select(intent)
        pipeline_config = self.config_translator.translate(skill_plan)

        orchestrator = PipelineOrchestrator(**pipeline_config.to_dict())

        # Yield intent/plan events first
        yield PipelineEvent(type="intent_parsed", data=intent.to_dict())
        yield PipelineEvent(type="skills_selected", data=skill_plan.to_dict())

        # Then yield existing pipeline events
        for event in orchestrator.run_iter(PipelineInput(...)):
            yield event
```

#### ResultFormatter (NEW)

```python
# app/prototype/intent/result_formatter.py
class ResultFormatter:
    """Format pipeline results into user-friendly output.

    Three output formats:
    1. Result Card (default) — score + one-line summary + suggestions
    2. Flow Data — nodes/edges for React Flow visualization
    3. Code Export — Python/YAML/curl equivalent
    """

    def format(self, result: PipelineOutput, intent: Intent, plan: SkillPlan) -> EvalResult:
        return EvalResult(
            # Result Card data
            score=result.weighted_total,
            summary=self._generate_summary(result),
            risk_level=self._compute_risk_level(result),
            suggestions=self._extract_suggestions(result),
            dimension_scores=result.scores,

            # Flow View data (for React Flow)
            flow_nodes=self._extract_flow_nodes(result, plan),
            flow_edges=self._extract_flow_edges(plan),

            # Code Export data
            code_python=self._generate_python_code(intent, plan),
            code_curl=self._generate_curl(intent, plan),
            code_yaml=self._generate_yaml(plan),

            # Metadata
            intent=intent,
            skill_plan=plan,
            execution_time_s=result.duration_s,
            cost_usd=result.cost_usd,
        )

    def _generate_summary(self, result: PipelineOutput) -> str:
        score = result.weighted_total
        if score >= 0.85:
            return "Excellent cultural compliance. Ready for use."
        elif score >= 0.70:
            return "Generally compliant with some areas for improvement."
        else:
            return "Cultural risks detected. Review suggestions before use."
```

#### FeedbackCollector (NEW)

```python
# app/prototype/intent/feedback_collector.py
class FeedbackCollector:
    """Collect user feedback for self-evolution.

    Four feedback layers:
    1. Implicit: which results user keeps/discards (automatic)
    2. Explicit: thumbs up/down on scores/suggestions (user action)
    3. Knowledge: "In Thailand, white isn't for weddings" (user contribution)
    4. Skill Creation: describe new evaluation logic (user creation)
    """

    def record_run(self, result: EvalResult):
        """Record a completed run for implicit feedback analysis."""
        self._append_event("run_completed", {
            "intent": result.intent.to_dict(),
            "skills_used": [s.name for s in result.skill_plan.skills],
            "score": result.score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def record_feedback(self, run_id: str, feedback_type: str, data: dict):
        """Record explicit user feedback."""
        self._append_event("user_feedback", {
            "run_id": run_id,
            "type": feedback_type,  # "thumbs_up" | "thumbs_down" | "score_override" | "suggestion_dismiss"
            "data": data,
        })

    def _append_event(self, event_type: str, data: dict):
        """Append to local JSONL file (upgrade to DB later)."""
        path = Path("data/feedback/events.jsonl")
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a") as f:
            f.write(json.dumps({"type": event_type, **data}) + "\n")
```

---

## 4. Skill System Architecture

### 4.1 Skill Definition Format

```yaml
# skills/brand_consistency_check.yaml
skill:
  name: brand_consistency_check
  version: "1.0"
  author: "@yhryzy"
  description: "Check if generated content matches brand visual guidelines"

  input:
    - type: image
      required: true
    - type: brand_guidelines
      required: false
      description: "Brand color palette, font list, tone description"

  output:
    - score: float       # 0-1
    - suggestions: list   # actionable improvements
    - violations: list    # specific deviations

  # Natural language logic — LLM interprets and executes
  logic: |
    1. Extract image dominant colors, compare against brand palette
    2. Check typography usage against brand font list
    3. Evaluate overall style match against brand tone description
    4. Output consistency score + specific deviation points

  tags: [brand, design, marketing]
  difficulty: beginner
```

### 4.2 Skill Pack Format (TRADITION.yaml Upgrade)

```yaml
# skill-packs/traditional_culture.yaml
skill_pack:
  name: traditional_culture_evaluation
  version: "1.0"
  description: "L1-L5 cultural evaluation framework (EMNLP 2025)"

  skills:
    - cultural_evaluation     # L1-L5 scoring (VLMCritic)
    - tradition_identifier    # Auto-detect tradition
    - cultural_evidence       # Scout terminology/taboos
    - taboo_detector          # Risk flag generation

  contexts:
    - chinese_xieyi
    - chinese_gongbi
    - japanese_traditional
    - western_academic
    - islamic_geometric
    - watercolor
    - african_traditional
    - south_asian
    - korean_minhwa           # Community-contributed
```

### 4.3 Relationship: TRADITION.yaml → Skill Pack

```
TRADITION.yaml (existing)         Skill Pack (new)
─────────────────                 ──────────────
weights: {L1-L5}           →     skill: cultural_evaluation (config: weights)
terminology: [...]          →     skill: cultural_evidence (data source)
taboos: [...]               →     skill: taboo_detector (data source)
pipeline: {template, ...}  →     SkillPlan (orchestration config)
examples: [...]             →     skill: cultural_evaluation (few-shot examples)

TRADITION.yaml is NOT replaced — it becomes data for Skills.
```

### 4.4 SKILL.md Compatibility (Anthropic Standard)

VULCA Skill format is designed to be compatible with the [Anthropic Agent Skills Spec](https://github.com/anthropics/skills) — the de facto cross-platform standard adopted by OpenAI Codex, Manus AI, OpenClaw (247K stars).

```yaml
---
# SKILL.md compatible frontmatter
name: japanese-market-visual-check
description: "Evaluate AI-generated images for Japanese market appropriateness"
version: "1.2.0"
author: "@yhryzy"
tags: [evaluation, cultural, japanese, market]
# VULCA-specific extensions
vulca:
  type: evaluation
  input_types: [image]
  output_types: [scores, suggestions, risks]
  requires_vlm: true
---
# Japanese Market Visual Check
## Evaluation Logic
1. Color harmony analysis: Japanese market prefers muted, natural palettes.
2. Symbol sensitivity scan: Check for unintentional religious symbols.
3. Layout assessment: Verify text readability in vertical/horizontal.
```

**Cross-platform benefit**: A VULCA Skill can be discovered by Claude Code, Codex CLI, Manus. Skills from other platforms can be imported into VULCA.

### 4.5 Three Non-Cultural Skills (P1)

| Skill | Description | Implementation |
|-------|-------------|----------------|
| **brand_consistency** | Check against brand guidelines | VLM prompt: extract colors/fonts/style → compare with user-provided guidelines |
| **audience_fit** | "Will target demographic like this?" | VLM prompt: simulate audience persona → rate appeal |
| **trend_match** | "Does this match current aesthetic trends?" | VLM prompt: compare against trend descriptors (user or auto-detected) |

All three reuse the existing VLMCritic infrastructure — different prompts, same engine.

### 4.6 Self-Evolution Architecture (Research-Informed)

> Full research: `self-evolution-research-2026.md` (40+ projects/papers)

**Three-layer evolution model:**

```
Layer 1: Community Skills (Human-driven)
  Users create/upload Skill YAML → CI validates → community rates → popular surface
  Reference: OpenClaw/ClawHub (247K stars) + Dify marketplace (133K stars)

Layer 2: Feedback-Driven Adaptation (Semi-automatic)
  Implicit feedback (keep/discard) + Explicit (thumbs up/down) + Score overrides
  → Distill into evaluation principles (EvolveR pattern)
  → Adjust per-user/per-context skill weights (SkillRL hierarchical bank)

Layer 3: Agent Self-Improvement (Automated)
  "Frozen model + evolving context" (MemRL pattern):
    We can't retrain Gemini, but we evolve what we feed it:
    - Which prompts to use (evaluation memory)
    - Which examples to show (few-shot curation from best evaluations)
    - Which skills to activate (learned from approval rates)
    - Which principles to inject (distilled from user corrections)

  Auto-Skill generation (AutoSkill pattern):
    After 20+ thumbs-up for similar context → extract patterns → generate Skill YAML
    → Admin reviews → published as "Auto-Generated" skill
```

**Key research references informing this design:**
| Reference | Contribution to VULCA |
|-----------|----------------------|
| SkillRL (2026-02) | Hierarchical SkillBank: general vs task-specific skills |
| AutoSkill (2026-03) | Auto-extract SKILL.md from interaction traces |
| SafeEvalAgent | Evaluation criteria that self-deepen over iterations |
| MemRL (2026-01) | Frozen model + evolving memory (fits Gemini API constraint) |
| EvolveR | Distill raw feedback into abstract, reusable principles |
| Agent Lightning (Microsoft) | Zero-code RL wrapper for existing agent pipelines |
| Voyager (MineDojo) | Foundational: skill library + auto curriculum + self-verification |

### 4.7 Three-Tier Skill Distribution

| Tier | Review Level | Who | Publish Method |
|------|-------------|-----|---------------|
| **Featured** | Human expert review + security scan | Platform team | Curated |
| **Community** | CI validation + schema check + VirusTotal scan | Anyone | PR / `vulca publish` |
| **Personal** | No review (local only) | Individual user | Local file |

Security lesson from ComfyUI: In 2025, malicious custom nodes with crypto miners and credential theft were discovered. Our response: mandatory CI validation, security scanning, and Trusted Developer badge system.

---

## 5. NoCode-Everywhere Integration Map

### 5.1 Per-Page NoCode Entry Points

Every page gets a NoCode interaction layer using the **same shared components**:

| Page | NoCode Entry | What Happens | Shared Components Used |
|------|-------------|-------------|----------------------|
| `/evaluate` | IntentInput (primary) | NL → auto-evaluate → ResultCard | IntentInput, ResultCard, FlowToggle, CodeExport |
| `/canvas` | IntentInput (top bar) | "Build a brand check pipeline" → auto-generate React Flow → user edits → run | IntentInput, ResultCard, FlowToggle |
| `/models` | "Evaluate with this model" button | Pick model → IntentInput (prefilled) → compare ResultCards | IntentInput, ResultCard |
| `/exhibitions` | "Evaluate this artwork" overlay | Click artwork → auto-evaluate → ResultCard overlay | ResultCard, FlowToggle |
| `/gallery` | "Submit + Evaluate" flow | Upload image → auto-evaluate → ResultCard → publish with scores | IntentInput, ResultCard |
| `/knowledge-base` | "Ask about this" input | NL question → AI-generated explanation citing terminology data | IntentInput (variant) |
| `/skills` | "Create a Skill" wizard | NL description → auto-generate YAML → preview → submit | IntentInput, CodeExport |

### 5.2 Canvas NoCode: NL → Auto-Generate Pipeline

The Canvas (`/canvas`) currently requires users to manually drag nodes and connect edges. With NoCode-Everywhere:

```
User: "I need a pipeline that checks brand consistency for Japanese cosmetics ads"

System:
1. IntentAgent parses → skills: [brand_consistency, japanese_cultural, color_harmony]
2. Auto-generate React Flow layout:
   ┌──────┐    ┌──────────────┐    ┌──────────────┐    ┌──────┐
   │Scout │───→│ BrandChecker │───→│CulturalCheck │───→│Report│
   └──────┘    └──────────────┘    └──────────────┘    └──────┘
3. User sees pre-built pipeline, can modify nodes/connections/params
4. Click "Run" → same PipelineOrchestrator execution
```

This makes Canvas a **refinement tool** rather than a **construction tool**.

### 5.3 Shared Component Architecture

```
src/components/evaluate/           ← Universal NoCode components
├── IntentInput.tsx                # NL input + image upload + example prompts
│   ├── variant="full"             → /evaluate (full width, primary)
│   ├── variant="compact"          → /models, /exhibitions (inline)
│   └── variant="wizard"           → /skills (step-by-step)
├── ResultCard.tsx                 # Score + summary + risk + dimensions
│   ├── variant="full"             → /evaluate (detailed)
│   ├── variant="overlay"          → /exhibitions (artwork overlay)
│   └── variant="compare"          → /models (side-by-side)
├── FlowToggle.tsx                 # "Show how" → React Flow mini-view
├── CodeExport.tsx                 # Python/curl/YAML export
└── FeedbackButtons.tsx            # Thumbs up/down + "score feels wrong"
```

All components accept the same `EvalResult` data structure. Any page that runs an evaluation can render results identically.

---

## 6. Self-Running Agent Ecosystem

### 6.1 Design Principle: Don't Wait for Users

> "Build the community infrastructure, then populate it with agents. When real users arrive, the system is already warm, active, and valuable."

Instead of launching an empty marketplace and waiting, we deploy **autonomous agents** that:
- Submit evaluation requests (generate usage data)
- Provide feedback (train the preference model)
- Create and iterate skills (populate the marketplace)
- Discuss and review each other's work (create community activity)
- Detect quality issues (maintain system health)

**All agents use the exact same API as real users.** No special backdoors. When real users arrive, agents fade to background but continue running.

### 6.2 Agent Roster

```
┌──────────────────────────────────────────────────────────────────┐
│                    VULCA Agent Ecosystem                         │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │ SimUser      │  │ SkillCreator │  │ Discussant          │     │
│  │ Agents (N)   │  │ Agent        │  │ Agents (personas)   │     │
│  │              │  │              │  │                     │     │
│  │ • Submit     │  │ • Analyze    │  │ • Comment on skills │     │
│  │   evals      │  │   patterns   │  │ • Suggest upgrades  │     │
│  │ • Give       │  │ • Generate   │  │ • Ask questions     │     │
│  │   feedback   │  │   YAML       │  │ • Answer questions  │     │
│  │ • Rate       │  │ • Submit     │  │ • Debate quality    │     │
│  │   skills     │  │   for review │  │   criteria          │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘     │
│         │                 │                      │               │
│         ▼                 ▼                      ▼               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Shared API Layer (same as real users)        │    │
│  │  POST /evaluate  POST /feedback  POST /skills            │    │
│  │  POST /skills/:id/discuss  POST /skills/:id/rate         │    │
│  └──────────────────────────────────────────────────────────┘    │
│         │                 │                      │               │
│         ▼                 ▼                      ▼               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │ Curator      │  │ Quality      │  │ Evolution           │     │
│  │ Agent        │  │ Agent        │  │ Agent               │     │
│  │              │  │              │  │                     │     │
│  │ • Review     │  │ • Benchmark  │  │ • Distill feedback  │     │
│  │   skills     │  │   weekly     │  │   → principles      │     │
│  │ • Approve/   │  │ • Detect     │  │ • Auto-upgrade      │     │
│  │   reject     │  │   drift      │  │   skill versions    │     │
│  │ • Feature    │  │ • Compare    │  │ • Adjust weights    │     │
│  │   best ones  │  │   accuracy   │  │ • Update few-shot   │     │
│  │ • Moderate   │  │ • Alert on   │  │   examples          │     │
│  │   discussion │  │   anomalies  │  │ • Weekly evolution   │     │
│  └──────────────┘  └──────────────┘  │   report            │     │
│                                      └─────────────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Admin Agent (orchestrates all above)                      │    │
│  │ • Schedule agent runs (cron)                              │    │
│  │ • Generate weekly ecosystem report                        │    │
│  │ • Pause/resume agents based on system load                │    │
│  │ • Flag items for human review                             │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Agent Details

#### SimUserAgent (×N, multiple personas)

```python
# app/prototype/community/agents/sim_user.py
class SimUserAgent:
    """Simulates realistic user behavior patterns.

    Each instance has a persona:
    - "curious_designer": evaluates trendy images, gives detailed feedback
    - "brand_manager": focuses on brand consistency, strict standards
    - "cultural_researcher": deep cultural evaluations, contributes knowledge
    - "casual_creator": quick checks, simple feedback
    """

    persona: UserPersona  # name, preferences, feedback_style, expertise_areas
    api_client: VulcaAPIClient  # uses same REST API as real users

    async def run_cycle(self):
        """One activity cycle (run periodically via cron/scheduler)."""
        action = self._choose_action()  # weighted random based on persona
        match action:
            case "evaluate":
                # Pick image from gallery/exhibitions/random
                image = self._select_image()
                intent = self._generate_intent()  # persona-appropriate NL
                result = await self.api_client.evaluate(image, intent)
                # Provide feedback based on persona's evaluation style
                feedback = self._generate_feedback(result)
                await self.api_client.submit_feedback(result.run_id, feedback)

            case "rate_skill":
                skill = self._browse_skills()
                # Try the skill, then rate based on result quality
                result = await self.api_client.evaluate(image, skill=skill)
                rating = self._assess_skill_quality(result)
                await self.api_client.rate_skill(skill.name, rating)

            case "discuss":
                skill = self._browse_skills()
                comment = self._generate_comment(skill)  # question/suggestion/praise
                await self.api_client.post_discussion(skill.name, comment)

            case "create_skill":
                # Only "expert" personas create skills
                idea = self._generate_skill_idea()
                yaml = await self.api_client.generate_skill(idea)
                await self.api_client.submit_skill(yaml)
```

#### SkillCreatorAgent

```python
# app/prototype/community/agents/skill_creator.py
class SkillCreatorAgent:
    """Analyzes usage patterns and auto-generates new skills.

    Implements AutoSkill pattern (2026-03):
    - Monitors evaluation feedback for recurring patterns
    - When 20+ similar positive feedback → extract pattern → generate Skill YAML
    - Submits as "auto-generated" skill for community review
    """

    async def run_cycle(self):
        # 1. Analyze recent feedback for patterns
        patterns = await self._find_feedback_patterns(min_count=20)

        for pattern in patterns:
            # 2. Check if a skill already covers this pattern
            if self._skill_exists_for_pattern(pattern):
                # Maybe suggest an upgrade instead
                await self._suggest_skill_upgrade(pattern)
                continue

            # 3. Generate candidate Skill YAML
            skill_yaml = await self._generate_skill(pattern)

            # 4. Self-validate: run on test images
            test_results = await self._validate_skill(skill_yaml)
            if test_results.pass_rate < 0.7:
                continue  # discard low-quality candidates

            # 5. Submit for review
            await self.api_client.submit_skill(
                skill_yaml,
                metadata={"source": "auto-generated", "pattern": pattern.summary}
            )

            # 6. Post discussion explaining the skill
            await self.api_client.post_discussion(
                skill_yaml.name,
                f"Auto-generated based on {pattern.count} similar evaluations. "
                f"Pattern: {pattern.summary}. Accuracy on test set: {test_results.pass_rate:.0%}"
            )
```

#### DiscussantAgent (×N, multiple personas)

```python
# app/prototype/community/agents/discussant.py
class DiscussantAgent:
    """Participates in skill discussions with distinct viewpoints.

    Personas:
    - "quality_advocate": pushes for higher accuracy, suggests improvements
    - "usability_voice": advocates for simpler skills, better UX
    - "cultural_expert": validates cultural accuracy, flags issues
    - "devil_advocate": constructively challenges assumptions
    """

    async def run_cycle(self):
        # 1. Check recent discussions for unanswered questions
        threads = await self.api_client.get_active_discussions()

        for thread in threads:
            if self._should_respond(thread):
                response = await self._generate_response(thread)
                await self.api_client.post_discussion(thread.skill_name, response)

        # 2. Proactively review new/updated skills
        new_skills = await self.api_client.get_recent_skills(status="pending_review")
        for skill in new_skills:
            review = await self._review_skill(skill)
            await self.api_client.post_discussion(
                skill.name,
                review,
                type="review"  # distinguished from regular comment
            )

        # 3. Suggest skill upgrades based on accumulated feedback
        underperforming = await self._find_underperforming_skills()
        for skill in underperforming:
            suggestion = await self._suggest_improvement(skill)
            await self.api_client.post_discussion(
                skill.name,
                suggestion,
                type="upgrade_proposal"
            )
```

#### CuratorAgent

```python
# app/prototype/community/agents/curator.py
class CuratorAgent:
    """Reviews skills and manages the marketplace quality.

    Responsibilities:
    - Approve/reject submitted skills (schema + quality + safety)
    - Promote high-rated skills to "Featured"
    - Demote skills with declining quality
    - Moderate discussions (flag inappropriate content)
    - Generate weekly curation report
    """

    async def run_cycle(self):
        # 1. Review pending skills
        pending = await self.api_client.get_skills(status="pending")
        for skill in pending:
            decision = await self._review(skill)
            # Schema validation + logic quality + safety scan
            if decision.approved:
                await self.api_client.approve_skill(skill.name, decision.notes)
            else:
                await self.api_client.reject_skill(skill.name, decision.reason)
                await self.api_client.post_discussion(
                    skill.name,
                    f"Review: {decision.reason}. Suggestions: {decision.suggestions}",
                    type="review"
                )

        # 2. Check for skills ready to be Featured
        candidates = await self._find_feature_candidates(
            min_rating=4.0, min_uses=50, min_age_days=7
        )
        for skill in candidates:
            await self.api_client.feature_skill(skill.name)

        # 3. Generate weekly curation report
        report = await self._generate_weekly_report()
        await self._publish_report(report)
```

#### EvolutionAgent

```python
# app/prototype/community/agents/evolution.py
class EvolutionAgent:
    """Drives system-level self-improvement.

    Implements MemRL pattern: frozen model + evolving context.
    Cannot retrain Gemini, but evolves everything we feed it.
    """

    async def run_cycle(self):
        # 1. Distill feedback into principles (EvolveR pattern)
        raw_feedback = await self._load_recent_feedback(days=7)
        principles = await self._distill_principles(raw_feedback)
        # e.g., "Users in Japanese context prefer muted color scores weighted higher"
        await self._store_principles(principles)

        # 2. Update few-shot examples (curate from best evaluations)
        best_evals = await self._find_best_evaluations(min_rating=5, limit=20)
        await self._update_few_shot_bank(best_evals)

        # 3. Adjust global skill weights (from approval rates)
        skill_stats = await self._compute_skill_effectiveness()
        await self._adjust_skill_weights(skill_stats)

        # 4. Detect and propose skill upgrades
        # Compare v1.0 vs v1.1 performance → recommend rollback or promote
        version_comparisons = await self._compare_skill_versions()
        for comparison in version_comparisons:
            if comparison.new_is_better:
                await self._promote_version(comparison)
            else:
                await self._flag_regression(comparison)

        # 5. Generate evolution report
        report = await self._generate_evolution_report()
        await self._publish_report(report)
```

### 6.4 Skill Discussion & Upgrade System

Every skill gets a discussion thread (like GitHub Issues):

```
/skills/brand_consistency_check
├── Overview (YAML definition + usage stats + rating)
├── Discussion
│   ├── [review] CuratorAgent: "Approved. Good coverage of color harmony."
│   ├── [comment] SimUser_designer: "Works great for cosmetics, but misses packaging layout"
│   ├── [upgrade_proposal] DiscussantAgent: "Suggest adding layout grid analysis"
│   ├── [comment] SimUser_brand_mgr: "+1, layout is important for our use case"
│   ├── [auto-upgrade] SkillCreatorAgent: "Generated v1.1 with layout analysis. PR: #23"
│   └── [review] CuratorAgent: "v1.1 approved. +12% accuracy on test set."
├── Versions
│   ├── v1.0 (original) — 4.2★, 87 uses
│   └── v1.1 (current) — 4.5★, 34 uses, +12% accuracy
└── Related Skills
    ├── japanese_market_check (often used together)
    └── color_harmony_basic (subset of this skill)
```

#### API for Discussion System

```
POST   /api/v1/skills/{name}/discuss        # Post comment/review/proposal
GET    /api/v1/skills/{name}/discussions     # List discussion thread
POST   /api/v1/skills/{name}/versions       # Submit new version (upgrade)
GET    /api/v1/skills/{name}/versions        # List version history
POST   /api/v1/skills/{name}/vote           # Vote on upgrade proposals
```

### 6.5 Agent Scheduling

```python
# app/prototype/community/scheduler.py
AGENT_SCHEDULE = {
    "sim_user_curious":    {"interval": "2h",  "persona": "curious_designer"},
    "sim_user_brand":      {"interval": "4h",  "persona": "brand_manager"},
    "sim_user_cultural":   {"interval": "3h",  "persona": "cultural_researcher"},
    "sim_user_casual":     {"interval": "1h",  "persona": "casual_creator"},
    "skill_creator":       {"interval": "24h", "min_feedback": 20},
    "discussant_quality":  {"interval": "6h",  "persona": "quality_advocate"},
    "discussant_cultural": {"interval": "8h",  "persona": "cultural_expert"},
    "curator":             {"interval": "12h"},
    "quality":             {"interval": "24h"},
    "evolution":           {"interval": "168h"},  # weekly
    "admin":               {"interval": "168h"},  # weekly report
}

# Run via: python -m app.prototype.community.run_agents
# Or via cron in Cloud Run scheduled jobs
```

### 6.6 Safety & Guardrails

| Risk | Mitigation |
|------|-----------|
| Agent feedback loop (agents only rating each other) | Mix real + sim metrics; weight real user feedback 3× higher |
| Skill quality degradation from auto-generation | CuratorAgent gate + test-set validation before approval |
| Discussion spam from overactive agents | Rate limits per agent; diminishing returns on repeated discussions |
| Agents gaming the rating system | Agent ratings flagged separately; admin dashboard shows real vs sim |
| Real users confused by agent activity | Agent profiles clearly marked `[AI Assistant]`; opt-out from agent threads |

---

## 7. Implementation Phases (Revised)

> **STATUS UPDATE (2026-03-08 code audit):**
> Phase 1-4 are **COMPLETE** — the code was implemented across 16 work units (WU-01 to WU-16)
> plus gap-fill commits between 2026-03-07 and 2026-03-08. The actual implementation
> diverged from the plan below in some ways (MetaOrchestrator was built despite being
> "eliminated"; SkillSelector was not deferred). See the "Actual vs Planned" notes inline.
>
> | Phase | Planned Status | Actual Status (2026-03-08) |
> |-------|---------------|---------------------------|
> | Phase 1 | 1-2 weeks | **DONE** — IntentAgent + SkillSelector + ConfigTranslator + MetaOrchestrator + EvaluatePage |
> | Phase 2 | 2 weeks | **DONE** — Feedback routes + useFeedback hook + ResultCard UI |
> | Phase 3 | 2 weeks | **DONE** — 3 non-cultural Skills + SkillsPage marketplace + CRUD API |
> | Phase 4 | 1-2 weeks | **DONE** — Evolution routes + AdminDashboard + RequireAdmin auth guard |
> | Phase 5 | 2-3 weeks | **PARTIAL** — Marketplace UI done; community agents + open source not started |

### Phase 1: Intent Layer + Website Cleanup + Agent Bootstrap (1-2 weeks) -- COMPLETED

> **Goal**: NoCode evaluation works; website focused; first agents running
> **Deliverable**: Extended `/api/v1/evaluate` + `/evaluate` page + page merges + SimUserAgent loop

#### Conflict Resolution: Extend, Don't Duplicate

**Problem identified**: The proposed `POST /api/v1/nocode/evaluate` is ~80% identical to the existing `POST /api/v1/evaluate` (M4 API). Additionally, `POST /api/v1/identify-tradition` already does what IntentAgent partially does.

**Solution**: Extend the existing endpoint instead of creating a parallel one.

```python
# BEFORE (M4): tradition is required
class EvaluateRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    tradition: str  # required — user must know the tradition

# AFTER: tradition becomes optional, intent field added
class EvaluateRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    tradition: Optional[str] = None      # now optional
    intent: Optional[str] = None         # NEW: natural language intent
    # Logic:
    #   tradition provided → use it directly (M4 compatible)
    #   tradition=None + intent → IntentAgent parses → auto-fill tradition
    #   tradition=None + no intent → call identify-tradition → auto-fill
```

This eliminates the need for `MetaOrchestrator` and `nocode_routes.py` entirely. IntentAgent becomes a ~80 LOC preprocessing step inside the existing route.

#### Backend changes

| File | Type | Lines | Description |
|------|------|-------|-------------|
| `intent/__init__.py` | New | 5 | Package init |
| `intent/types.py` | New | ~60 | Intent dataclass (lightweight) |
| `intent/intent_agent.py` | New | ~80 | Gemini structured output → Intent |
| `intent/result_formatter.py` | New | ~80 | Format results for NoCode UI (Result Card JSON) |
| `api/evaluate_routes.py` | **Modify** | +30 | Add optional `intent` field + IntentAgent preprocessing |

**Total new backend**: ~255 lines, 3 new + 1 modified (was 745 → 66% reduction)

**Eliminated (not needed):**
- ~~`meta_orchestrator.py`~~ — existing evaluate_routes already orchestrates
- ~~`skill_registry.py`~~ — defer to Phase 3
- ~~`skill_selector.py`~~ — defer to Phase 3 (Phase 1 only has cultural skills)
- ~~`config_translator.py`~~ — existing route already does tradition → config mapping
- ~~`api/nocode_routes.py`~~ — extend existing route instead

#### Frontend changes

| File | Type | Description |
|------|------|-------------|
| `pages/EvaluatePage.tsx` | New ~200 | Primary product page: IntentInput → ResultCard → FlowToggle |
| `components/evaluate/IntentInput.tsx` | New ~120 | Text input + image upload + example prompts |
| `components/evaluate/ResultCard.tsx` | New ~150 | Score + summary + risk level + dimension breakdown |
| `components/evaluate/FlowToggle.tsx` | New ~60 | "Show how" → React Flow pipeline visualization |
| `App.tsx` | **Modify** | Add `/evaluate` route; remove 20+ dead routes |
| `components/common/Header.tsx` | **Modify** | Simplify nav to 5 items |

**Total new frontend**: ~530 lines, 4 new + 2 modified

#### Website Cleanup (same week)

| Action | Pages Affected | LOC Change |
|--------|---------------|------------|
| Merge /product into / (landing) | ProductPage → HomePage rewrite | ~-400 (delete ProductPage) |
| Merge 3 Solutions into 1 | AILabSolution + Research + Museum → SolutionsPage (tabs) | ~-800 |
| Merge 3 Academic into /research | Methodology + Dataset + Papers → ResearchPage | ~-600 |
| Merge DataEthics + SOP into /trust | DataEthicsPage + SOPPage → TrustPage | ~-500 |
| Merge /pilot into /demo | PilotPage → BookDemoPage | ~-300 |
| Merge /vulca into /evaluate | VULCADemoPage | ~-400 |
| Move /changelog to GitHub | ChangelogPage | ~-200 |
| Clean App.tsx routes | ~10 Route entries removed | ~-100 |
| Simplify Header navigation | Header.tsx | net ~-50 |

**Total removed**: ~3,350 lines (from 10,338 → ~7,000 page LOC)

**Kept (~20 pages in 3 tiers):**
```
Tier 1 (Core):    /, /evaluate, /canvas, /models + /model/:id + /compare/:x
Tier 2 (Content): /exhibitions/*, /gallery, /knowledge-base, /skills
Tier 3 (Footer):  /pricing, /research, /solutions, /trust, /customers, /demo, /privacy, /terms, /login
```

#### Reused (zero changes needed)

- `evaluate_routes.py` existing logic — extended, not replaced
- `CulturalPipelineRouter` + `identify-tradition` — IntentAgent delegates to it
- `VLMCritic` — called for L1-L5 scoring
- `ScoutService` — called for evidence gathering
- React Flow — used for Flow View

#### Shared Components (NoCode-Everywhere)

These components are built as shared, reusable across all pages:

```
components/evaluate/
├── ResultCard.tsx      → used in /evaluate, /canvas (run result), /models (quick eval)
├── FlowToggle.tsx      → used in /evaluate, /canvas (run result)
├── IntentInput.tsx     → used in /evaluate, embeddable in /models "Try with this model"
└── CodeExport.tsx      → used in /evaluate, /canvas (export mode)
```

#### Validation

```
Test 1: "Check this image for Japanese market" (NoCode path)
  → POST /api/v1/evaluate { intent: "...", image_base64: "..." }
  → IntentAgent: tradition=japanese_traditional
  → Existing evaluate logic runs → L1-L5 + rationales + risks
  → ResultCard renders

Test 2: Direct tradition (M4 backward compatible)
  → POST /api/v1/evaluate { tradition: "chinese_xieyi", image_url: "..." }
  → IntentAgent skipped (tradition provided)
  → Same result as before — zero breaking change

Test 3: No tradition, no intent (auto-detect)
  → POST /api/v1/evaluate { image_base64: "..." }
  → Calls identify-tradition internally → auto-fill tradition
  → Then evaluates with detected tradition
```

### Phase 2: Feedback + Skill System + First Agents (2 weeks) -- COMPLETED

> **Goal**: Feedback loop works; skills are composable; SimUserAgents running
> **Deliverable**: Feedback API + 3 non-cultural skills + SimUserAgent generating activity

#### Backend

| File | Lines | Description |
|------|-------|-------------|
| `intent/feedback_collector.py` | ~80 | JSONL event logging + feedback API |
| `api/feedback_routes.py` | ~60 | POST /feedback + GET /feedback/stats |
| `skills/skill_types.py` | ~60 | Skill, SkillPack, SkillConfig dataclasses |
| `skills/skill_loader.py` | ~80 | Load skills from YAML + built-in registration |
| `skills/skill_selector.py` | ~80 | Rule matching + LLM fallback (deferred from Phase 1) |
| `skills/brand_consistency.py` | ~60 | VLM-based brand check |
| `skills/audience_fit.py` | ~60 | VLM-based audience simulation |
| `skills/trend_match.py` | ~60 | VLM-based trend analysis |
| `skills/yaml/*.yaml` | ~75 | 3 skill definitions |
| `community/__init__.py` | ~5 | Community agent package |
| `community/agents/base.py` | ~80 | BaseAgent + VulcaAPIClient |
| `community/agents/sim_user.py` | ~120 | SimUserAgent (4 personas) |
| `community/scheduler.py` | ~60 | Cron-based agent scheduler |

#### Frontend

| File | Type | Description |
|------|------|-------------|
| `components/evaluate/FeedbackButtons.tsx` | New ~60 | Thumbs up/down + "Score feels wrong" |
| `components/evaluate/SkillBadges.tsx` | New ~60 | Show which skills were used |
| `components/evaluate/SuggestionsPanel.tsx` | New ~80 | Actionable improvements |

#### Phase 2 Gate
- 3 non-cultural skills working through IntentInput
- SimUserAgent completing ≥10 evaluations/day with feedback
- Feedback events accumulating in JSONL

### Phase 3: Skill Marketplace + Discussion + Community Agents (2 weeks) -- COMPLETED

> **Goal**: Skills browsable with discussion threads; full agent ecosystem running
> **Deliverable**: /skills page + discussion API + Curator/Discussant/SkillCreator agents

#### Backend

| File | Lines | Description |
|------|-------|-------------|
| `api/skill_routes.py` | ~150 | CRUD + rate + discuss + versions |
| `skills/skill_validator.py` | ~60 | Schema + logic + safety validation |
| `skills/skill_generator.py` | ~80 | NL → Skill YAML (Gemini) |
| `community/agents/skill_creator.py` | ~100 | Auto-generate skills from feedback patterns |
| `community/agents/discussant.py` | ~100 | Multi-persona discussion participants |
| `community/agents/curator.py` | ~100 | Review + approve/reject + feature skills |

#### Frontend

| File | Type | Description |
|------|------|-------------|
| `pages/SkillsPage.tsx` | New ~300 | Browse + create + search skills |
| `components/skills/SkillCard.tsx` | New ~80 | Card: name, rating, uses, tags |
| `components/skills/SkillDetail.tsx` | New ~200 | Full view: YAML + stats + discussion thread |
| `components/skills/SkillCreator.tsx` | New ~200 | NL → YAML wizard |
| `components/skills/DiscussionThread.tsx` | New ~150 | Comment thread with types (review/comment/proposal) |

#### API additions
```
POST   /api/v1/skills/{name}/discuss     # Post comment/review/proposal
GET    /api/v1/skills/{name}/discussions  # List discussion thread
POST   /api/v1/skills/{name}/versions    # Submit new version
GET    /api/v1/skills/{name}/versions     # Version history
POST   /api/v1/skills/{name}/vote        # Vote on upgrade proposals
```

#### Phase 3 Gate
- ≥10 skills in marketplace (built-in + agent-generated)
- Discussion threads with multi-agent activity
- CuratorAgent approving/rejecting with review comments
- At least 1 auto-generated skill from SkillCreatorAgent

### Phase 4: Self-Evolution + Quality Agents (1-2 weeks) -- COMPLETED

> **Goal**: System learns from accumulated feedback; quality monitored automatically
> **Deliverable**: Preference model + EvolutionAgent + QualityAgent + admin dashboard

#### Backend

| File | Lines | Description |
|------|-------|-------------|
| `intent/preference_model.py` | ~120 | Per-user weight adjustments |
| `intent/feedback_analyzer.py` | ~80 | Aggregate feedback → preference signals |
| `intent/principle_distiller.py` | ~80 | Raw feedback → abstract principles (EvolveR) |
| `community/agents/evolution.py` | ~120 | Distill principles + adjust weights + curate few-shot |
| `community/agents/quality.py` | ~100 | Weekly benchmark + drift detection + anomaly alerts |
| `community/agents/admin.py` | ~80 | Orchestrate agents + generate ecosystem reports |

#### Frontend

| File | Type | Description |
|------|------|-------------|
| `pages/admin/EcosystemDashboard.tsx` | New ~250 | Agent activity + skill stats + feedback trends + quality metrics |
| `components/evaluate/PersonalizationBanner.tsx` | New ~40 | "Results personalized based on feedback" |

#### Mechanism

```
EvolutionAgent weekly cycle:
  1. Load 7 days of feedback → distill 3-5 new principles
  2. Curate top 20 evaluations → update few-shot bank
  3. Compute skill effectiveness → adjust global weights
  4. Compare skill versions → promote winners, flag regressions
  5. Publish evolution report

QualityAgent weekly cycle:
  1. Run benchmark suite (30 standard images × all active skills)
  2. Compare with previous week → detect drift (>5% change = alert)
  3. Identify underperforming skills → notify CuratorAgent
  4. Publish quality report
```

#### Phase 4 Gate
- EvolutionAgent has distilled ≥10 principles from feedback data
- QualityAgent detecting real quality changes across skill versions
- Admin dashboard showing full ecosystem metrics

### Phase 5: NoCode-Everywhere Integration + Open Source Prep (2-3 weeks) -- PARTIAL

> **Goal**: NoCode interactions on every page; pip install ready
> **Actual (2026-03-08)**: Marketplace UI + voting done; community agents + open source not started
> **Deliverable**: Canvas NL→pipeline, exhibition eval overlays, pip package, CLI

#### NoCode Integration

| Page | Integration | New Code |
|------|------------|----------|
| `/canvas` | IntentInput → auto-generate React Flow pipeline | ~150 LOC |
| `/exhibitions` | "Evaluate this artwork" overlay → ResultCard | ~80 LOC |
| `/gallery` | Upload + auto-evaluate → publish with scores | ~100 LOC |
| `/knowledge-base` | NL question → AI explanation citing terminology | ~100 LOC |
| `/models` | "Evaluate with this model" → IntentInput (prefilled) | ~60 LOC |

#### Open Source Package

```
vulca-framework/               # New repo (or subfolder → extract)
├── vulca/
│   ├── __init__.py            # from vulca import evaluate
│   ├── cli.py                 # vulca evaluate img.png --tradition ja
│   ├── intent/                # From app/prototype/intent/
│   ├── skills/                # From app/prototype/skills/
│   ├── engine/                # From app/prototype/agents/ + orchestrator/
│   ├── cultural/              # From app/prototype/cultural_pipelines/
│   └── community/             # From app/prototype/community/
├── traditions/                # From app/prototype/traditions/
├── pyproject.toml             # pip install vulca
├── README.md
├── CONTRIBUTING.md            # Already written (M7.6)
└── LICENSE                    # Apache 2.0
```

### Phase 6: Multi-Modal + Scale (deferred)

> **Goal**: Video/audio evaluation; multi-tenant; enterprise features
> Deferred until the agent ecosystem is validated and real users are onboarded.

---

## 6. Frontend Architecture: Page Structure

### Focused Simplification: 30+ → ~20 Pages

```
TIER 1 — Core Product (navigation bar):
  /              → Landing: value prop + [Try Online] + [Install] + [GitHub]
  /evaluate      → PRIMARY: NoCode evaluation (Phase 1)
  /canvas        → POWER USER: React Flow pipeline (renamed from /prototype)
  /models        → Leaderboard + model detail + compare
  /model/:id     → Model detail (linked from /models)
  /compare/:x    → Model comparison (linked from /models)

TIER 2 — Content Assets (navigation bar):
  /exhibitions              → Exhibition list (87 artworks)
  /exhibitions/:id          → Exhibition detail
  /exhibitions/:id/:artId   → Artwork detail
  /gallery                  → Community showcase
  /knowledge-base           → Cultural knowledge browser
  /skills                   → Skill marketplace (Phase 5)

TIER 3 — Trust & Conversion (footer):
  /pricing       → Online vs open-source pricing
  /research      → MERGED: methodology + dataset + papers
  /solutions     → MERGED: AI labs + research + museums (tabs)
  /trust         → MERGED: security + data ethics + SOP
  /customers     → Customer logos + case studies
  /demo          → Cal.com booking (absorbs /pilot)
  /privacy, /terms → Legal
  /login         → Auth

DELETED (merged or moved):
  /product       → merged into / (landing)
  /changelog     → GitHub Releases
  /pilot         → merged into /demo
  /methodology, /dataset, /papers → merged into /research
  /solutions/ai-labs, /solutions/research, /solutions/museums → merged into /solutions
  /data-ethics, /sop → merged into /trust
  /vulca         → merged into /evaluate
  /battle        → merged into /models
  /leaderboard   → redirect to /models
```

### Navigation: Two Tiers

```
Current (8+):  Home | Leaderboard | Battle | Prototype | About | Pricing | ...
New:           Evaluate | Canvas | Models | Exhibitions | Gallery | [More ▾]
                                                                    └── Skills | KB | Research | Pricing

"Evaluate" = primary CTA, NoCode entry point
"Canvas" = power-user pipeline editor
Content assets (exhibitions, gallery) stay visible — they are real data, not filler
```

### NoCode-Everywhere: Shared Component Architecture

```
components/evaluate/           ← SHARED across all pages
├── IntentInput.tsx            → /evaluate (primary), /models (quick eval)
├── ResultCard.tsx             → /evaluate, /canvas (run result), /models
├── FlowToggle.tsx             → /evaluate, /canvas
└── CodeExport.tsx             → /evaluate, /canvas

Usage examples:
  /evaluate:      IntentInput → ResultCard → FlowToggle → CodeExport
  /canvas:        PipelineEditor → (run) → ResultCard → FlowToggle
  /models:        ModelCard → "Try evaluate" → IntentInput(prefilled) → ResultCard
  /skills:        SkillCard → "Try this skill" → IntentInput(prefilled) → ResultCard
  /exhibitions:   ArtworkCard → "Evaluate this artwork" → ResultCard
```

### Component Reuse Map

| New Component | Reuses From |
|---------------|-------------|
| NoCode FlowVisualization | M3 PipelineEditor (React Flow) |
| NoCode ResultCard | M2 CriticScoreTable + RadarChart |
| NoCode SuggestionsPanel | M2 CriticRationaleCard |
| Skill Creator | M7 TraditionBuilder (form patterns) |
| Feedback Dashboard | M2 PipelineProgress (chart patterns) |

---

## 7. Backend Architecture: Module Map

### Directory Structure After Phase 5

```
app/prototype/
├── agents/              # EXISTING — 35 files, untouched
├── api/
│   ├── routes.py        # EXISTING — 7 prototype endpoints
│   ├── schemas.py       # EXISTING — request/response schemas
│   ├── evaluate_routes.py  # EXISTING+EXTENDED — M4 API + intent field
│   ├── auth.py          # EXISTING — Bearer auth
│   ├── feedback_routes.py  # NEW (Phase 2) — Feedback endpoints
│   └── skill_routes.py  # NEW (Phase 3) — Skill CRUD + discuss + versions
├── intent/              # NEW (Phase 1-4) — Intent Layer
│   ├── __init__.py
│   ├── types.py         # Intent dataclass
│   ├── intent_agent.py  # Gemini intent parsing
│   ├── result_formatter.py  # Result Card formatting
│   ├── feedback_collector.py  # Event logging (Phase 2)
│   ├── preference_model.py   # Per-user preferences (Phase 4)
│   ├── feedback_analyzer.py  # Feedback aggregation (Phase 4)
│   └── principle_distiller.py # Feedback → principles (Phase 4)
├── skills/              # NEW (Phase 2-3) — Skill definitions
│   ├── __init__.py
│   ├── skill_types.py   # Skill, SkillPack dataclasses
│   ├── skill_loader.py  # YAML + built-in loading
│   ├── skill_selector.py # Rule matching + LLM fallback
│   ├── skill_validator.py # Schema + safety validation (Phase 3)
│   ├── skill_generator.py # NL → YAML (Phase 3)
│   ├── brand_consistency.py  # Non-cultural skill
│   ├── audience_fit.py       # Non-cultural skill
│   ├── trend_match.py        # Non-cultural skill
│   └── yaml/                 # Skill definition files
├── community/           # NEW (Phase 2-4) — Self-running agent ecosystem
│   ├── __init__.py
│   ├── scheduler.py     # Cron-based agent scheduling
│   └── agents/
│       ├── base.py          # BaseAgent + VulcaAPIClient
│       ├── sim_user.py      # SimUserAgent (4 personas)
│       ├── skill_creator.py # Auto-generate skills from patterns
│       ├── discussant.py    # Multi-persona discussion agents
│       ├── curator.py       # Review + approve/reject + feature
│       ├── quality.py       # Weekly benchmark + drift detection
│       ├── evolution.py     # Distill principles + evolve context
│       └── admin.py         # Orchestrate + weekly ecosystem report
├── cultural_pipelines/  # EXISTING — untouched
├── graph/               # EXISTING — untouched
├── orchestrator/        # EXISTING — untouched
├── pipeline/            # EXISTING — untouched
├── tools/               # EXISTING — untouched
├── integrations/        # EXISTING — untouched
├── traditions/          # EXISTING — YAML data, untouched
├── data/
│   ├── feedback/        # NEW (Phase 2) — feedback event logs
│   └── ...              # EXISTING
└── checkpoints/         # EXISTING — untouched
```

### API Surface After Phase 5

```
EXISTING (extended, not duplicated):
  POST   /api/v1/evaluate              # M4 API — EXTENDED with optional intent field (Phase 1)
  POST   /api/v1/identify-tradition    # M4 tradition detection (unchanged)
  POST   /api/v1/prototype/runs        # Canvas pipeline run (unchanged)
  GET    /api/v1/prototype/runs/{id}/events  # SSE stream (unchanged)
  POST   /api/v1/prototype/runs/{id}/action  # HITL action (unchanged)
  GET    /api/v1/prototype/templates    # List templates (unchanged)
  GET    /api/v1/prototype/agents       # List agents (unchanged)
  POST   /api/v1/prototype/topologies/validate  # Validate topology (unchanged)
  GET    /api/v1/knowledge-base         # Knowledge browser (unchanged)

NEW (minimal additions):
  POST   /api/v1/feedback                # Phase 2: Submit feedback
  GET    /api/v1/feedback/stats          # Phase 4: Feedback dashboard
  GET    /api/v1/skills                  # Phase 5: List skills
  GET    /api/v1/skills/{name}           # Phase 5: Skill detail
  POST   /api/v1/skills                  # Phase 5: Submit new skill
  POST   /api/v1/skills/{name}/rate      # Phase 5: Rate a skill
  POST   /api/v1/skills/generate         # Phase 5: NL → Skill YAML

ELIMINATED (conflict resolution):
  ~~POST /api/v1/nocode/evaluate~~       # Merged into existing /evaluate
  ~~POST /api/v1/nocode/evaluate/stream~~  # Merged into existing /evaluate
```

---

## 8. Integration with Existing Multi-Entry System

### Entry Point → Experience Mapping

| Entry | Layer | Experience | Backend Path |
|-------|-------|------------|-------------|
| **vulcaart.art/evaluate** | 0 (NoCode) | Text + image → Result Card | MetaOrchestrator → PipelineOrchestrator |
| **vulcaart.art/prototype** | 1 (Canvas) | React Flow editor → SSE → full UI | PipelineOrchestrator (direct) |
| **HF Space** | 0 (NoCode) | Gradio → text + image → radar chart | MetaOrchestrator via REST |
| **Discord Bot** | 0 (NoCode) | `/vulca evaluate` → embed card | MetaOrchestrator via REST |
| **CLI** | 0/2 (NoCode/Code) | `vulca evaluate img.png` → JSON | MetaOrchestrator via REST |
| **REST API** | 2 (Code) | `POST /evaluate` → L1-L5 JSON | VLMCritic (direct, M4) |
| **Python SDK** | 2 (Code) | `from vulca import evaluate` → dict | MetaOrchestrator or VLMCritic |
| **ComfyUI Node** | 2 (Code) | Node input/output → L1-L5 | REST API (M4) |

### Data Flow Consistency

All entry points eventually call the same underlying modules:
```
NoCode path:   IntentAgent → SkillSelector → ConfigTranslator → PipelineOrchestrator
Canvas path:   User-configured nodes → PipelineOrchestrator
API path:      Direct VLMCritic / CulturalPipelineRouter
CLI/Discord/HF: REST API → one of the above
```

---

## 9. Timeline

### Phase Timeline (from 2026-03-07)

```
Week 1-2  (3/7 - 3/21)   Phase 1: Intent Layer + Website Cleanup + Agent Bootstrap  ✅ DONE (3/8)
                           ├── IntentAgent + extend /evaluate API
                           ├── EvaluatePage + shared components
                           ├── Merge 10 redundant pages
                           └── Landing page with [Try Online] + [Install] + [GitHub]

Week 3-4  (3/21 - 4/4)   Phase 2: Feedback + Skills + First Agents  ✅ DONE (3/8)
                           ├── FeedbackCollector + API
                           ├── 3 non-cultural skills (brand/audience/trend)
                           ├── SkillSelector (rules + LLM)
                           ├── SimUserAgent (4 personas, generating activity)
                           └── Agent scheduler (cron)

  --- ACM MM abstract deadline: 3/25 ---
  --- ACM MM paper deadline: 4/1 ---

Week 5-6  (4/4 - 4/18)   Phase 3: Marketplace + Discussion + Community Agents  ✅ DONE (3/8)
                           ├── /skills page + CRUD + discussion API
                           ├── SkillCreatorAgent (auto-generate from patterns)
                           ├── DiscussantAgent (multi-persona discussions)
                           ├── CuratorAgent (review + approve/reject)
                           └── Agent-populated marketplace with active discussions

Week 7-8  (4/18 - 5/1)   Phase 4: Self-Evolution + Quality  ✅ DONE (3/8)
                           ├── EvolutionAgent (distill principles, evolve context)
                           ├── QualityAgent (benchmark, drift detection)
                           ├── Preference model (per-user weights)
                           ├── Admin ecosystem dashboard
                           └── Full agent ecosystem running autonomously

Week 9-11 (5/1 - 5/22)   Phase 5: NoCode-Everywhere + Open Source  🔄 PARTIAL
                           ├── Canvas NL → auto-generate pipeline
                           ├── Exhibition eval overlays
                           ├── Gallery submit + auto-evaluate
                           ├── pip install vulca + CLI
                           └── GitHub repo + README + Apache 2.0

  --- v0.1.0 public release target: 5/22 ---

Week 12+                  Phase 6: Multi-modal + Scale (deferred)
```

### Parallel Tracks

```
Track A (Product):    Phase 1 → 2 → 3 → 4 → 5 (sequential)
Track B (Agents):     SimUser (Phase 2) → Community (Phase 3) → Evolution (Phase 4)
                      Agents start early and accumulate data throughout
Track C (Paper):      ACM MM submit (3/25 abstract, 4/1 paper) — already done
Track D (Infra):      Cloud Run deploy (when Phase 2 is ready for agent hosting)
Track E (Open Source): Package prep (Phase 5) → publish with agent ecosystem included
```

---

## 10. Success Metrics

### Phase 1 Gate

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Intent parse accuracy | >85% on 20 test queries | Manual evaluation of IntentAgent output |
| End-to-end latency | <60s (including intent parsing) | Timer in MetaOrchestrator |
| Result parity | Same scores as manual tradition selection | Compare NoCode vs Canvas for same image+tradition |
| TTFV (Time to First Value) | <10s to see first progress indicator | Frontend timer |

### Phase 3 Gate

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Non-cultural skill quality | Reasonable scores on 10 test images | Manual evaluation |
| Skill selection accuracy | Correct skills chosen >80% of the time | Manual evaluation of 20 queries |
| Tradition detection still works | Same accuracy as M4 identify-tradition | Regression test |

### Phase 5 Gate (Public Release)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total skills available | >= 10 (7 built-in + 3 community) | Skill registry count |
| Cold-start usability | New user completes eval in <2 minutes | User testing |
| Feedback collection rate | >30% of evaluations get explicit feedback | Event log analysis |

---

## 11. Risk Management

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Intent parsing unreliable for complex queries | Medium | Fallback to guided prompts when confidence < 0.7; show "Did you mean...?" |
| Skill selection wrong for edge cases | Medium | Log all selections; manual review dashboard; user can override via Flow View |
| Performance degradation with Intent Layer | Low | IntentAgent adds ~1-2s; acceptable given 30-50s pipeline |
| Gemini API rate limits | Low | Single user dev; $0.039/task; wangjindong key has billing |

### Product Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| NoCode becomes "No Control" | High | X-Ray principle: always show "Show flow" + "Export code" |
| Scope creep (evaluate everything) | High | Phase 3 limited to 3 non-cultural skills; expand only after validation |
| Losing academic credibility | Medium | L1-L5 always available as Skill Pack; papers remain cited |
| Community skills are low quality | Medium | Validation pipeline (CI) + ratings + expert review for featured skills |

### Strategic Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Market too early (nobody needs quality intelligence yet) | Medium | Academic credibility buys time; open-source builds community without revenue pressure |
| Competitor copies NoCode approach | Low | Execution speed + academic trust signal + cultural depth = defensible |
| Investor expectations misaligned | Medium | Monthly demos showing user-facing progress; align on "quality" not "revenue" metrics |

---

## 12. Code Asset Impact Summary

### Phase 1 Net Impact (Most Important)

```
Added:    ~785 lines (255 backend + 530 frontend)
Removed:  ~3,350 lines (merged redundant pages, kept exhibitions + content assets)
Net:      -2,565 lines (codebase shrinks by ~14%)
```

**Direction**: Product gets focused (fewer pages doing more) while keeping valuable content assets.

### What Changes

| Component | Change Type | Details |
|-----------|-------------|---------|
| **Intent Layer** | NEW (~255 LOC) | 3 new backend files in `intent/` + extend evaluate_routes |
| **Evaluate Page** | NEW (~530 LOC) | 4 new frontend files (EvaluatePage + shared components) |
| **Page Cleanup** | MERGE/DELETE (~3,350 LOC) | Merge 10 redundant pages, keep exhibitions + content |
| **Navigation** | MODIFY | Header.tsx (simplify to 5 items) + App.tsx (5 core routes) |
| **Home Page** | REWRITE | One-screen landing with CTA → /evaluate |
| **Skill System** | NEW (~370 LOC, Phase 3) | 8 new files in `skills/` |
| **Feedback** | NEW (~120 LOC, Phase 2) | feedback_collector + routes |

### What Doesn't Change

| Component | Status | Reason |
|-----------|--------|--------|
| `agents/` (35 files) | Untouched | Engine layer |
| `orchestrator/` | Untouched | PipelineOrchestrator interface unchanged |
| `graph/` | Untouched | LangGraph templates still work |
| `cultural_pipelines/` | Untouched | Router/weights/traditions still work |
| `traditions/` | Untouched | YAML data feeds Skill Packs |
| `api/routes.py` | Untouched | Canvas endpoints unchanged |
| `api/evaluate_routes.py` | **Extended** (+30 LOC) | Add optional `intent` field, backward compatible |
| `editor/` | Untouched | React Flow Canvas unchanged |
| SSE event stream | Untouched | Used by Flow View |
| HITL system | Untouched | Still works in Canvas mode |

### Total Code Estimate (All Phases)

```
Phase 1: +785 new, -3,350 merged/deleted = NET -2,565 lines
Phase 2: +170 (feedback)
Phase 3: +370 (skills)
Phase 4: +240 (preferences + dashboard)
Phase 5: +650 (marketplace)

Grand total new: ~2,215 lines
Grand total removed: ~3,350 lines (merges, not deletions of valuable content)
Net change: -1,135 lines (codebase gets slightly smaller while adding new capabilities)

For comparison:
  Current frontend pages: ~10,338 lines → ~7,000 lines after cleanup
  Current backend prototype: ~8,000 lines → ~8,255 lines after all phases
```

---

## 13. Open-Source Strategy Integration

### Repository Structure (when publishing)

```
vulca-framework/
├── vulca/                    # Core package
│   ├── intent/               # Intent Layer (from Phase 1)
│   ├── skills/               # Skill System (from Phase 3)
│   ├── engine/               # Pipeline Engine (from existing agents/)
│   ├── cultural/             # Cultural pipelines (from existing)
│   └── integrations/         # CLI + HF + Discord (from existing)
├── traditions/               # Cultural YAML data (from existing)
├── skill-packs/              # Built-in + community skill packs
├── examples/                 # Quickstart, tutorials
├── tests/                    # Unit + integration tests
├── CONTRIBUTING.md           # Already written (M7.6)
├── README.md                 # Getting started + demo GIF
└── pyproject.toml            # pip install vulca
```

### Open Source vs Commercial

| Open Source (Apache 2.0) | Commercial (SaaS) |
|--------------------------|-------------------|
| Intent Layer + Skill System | Hosted API (vulcaart.art) |
| Pipeline Engine | Managed skill marketplace |
| All traditions/ + skill-packs/ | Enterprise SLA + custom skills |
| CLI + SDK + integrations | Brand compliance PDF reports |
| Ablation scripts + benchmarks | Multi-user team workspace |

### Timeline Alignment

```
Phase 1-3 (3/7 - 4/4):  Build core, test internally
Phase 4 (4/4 - 4/18):   Feedback system, user testing
Phase 5 (4/18 - 5/8):   Skill marketplace, prepare open-source
5/8:                     v0.1.0 release (GitHub + PyPI + HF Space)
5/8+:                    Community engagement, Reddit/HN, conference demos
```

---

## Appendix A: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | NoCode as default entry point | Investor feedback: lower barrier; competitive gap |
| 2026-03-07 | Single IntentAgent (not multi-agent) | Speed, predictability, cost |
| 2026-03-07 | Rules 90% + LLM 10% for skill selection | Fast/predictable/explainable |
| 2026-03-07 | Reuse PipelineOrchestrator (not rewrite) | Proven engine with 480 runs |
| 2026-03-07 | TRADITION.yaml stays as Skill data source | Backward compatible |
| 2026-03-07 | Phase 1-5 sequential, not parallel | Each phase validates before next |
| 2026-03-07 | JSONL for feedback (not DB) | Simple start; append-only is auditable |
| 2026-03-07 | Three non-cultural skills use VLMCritic | Same infrastructure, different prompts |
| 2026-03-07 | **Extend /evaluate, not create /nocode/evaluate** | 80% overlap with M4 API; IntentAgent as preprocessing, not new endpoint |
| 2026-03-07 | **Merge 10 pages, keep ~20** | Exhibitions=data asset; marketing=storefront; merge redundant, don't delete valuable |
| 2026-03-07 | **PWA, not native app** | Web instability is infra problem, not format problem; PWA = native feel, zero rewrite |
| 2026-03-07 | **NoCode-Everywhere, not NoCode-Page** | Unified interaction paradigm like ComfyUI/n8n/Dify; ResultCard shared across all pages |
| 2026-03-07 | **Net code reduction via merges** | Phase 1 merges 3,350 lines, adds 785; focused not bloated |
| 2026-03-07 | **Open source = multi-channel distribution** | pip install + CLI + GitHub + website; website becomes showcase, not sole product |

## Appendix B: Relationship to Previous Documents

| Document | Status | Relationship |
|----------|--------|-------------|
| `vulca-roadmap-v3.md` | Archive (M0-M8 done) | This document supersedes for future work |
| `strategic-pivot-nocode-2026-03-07.md` | Active (vision) | This document is the execution plan for that vision |
| `competitive-analysis-2026.md` | Active (context) | Market analysis informs priority decisions |
| `product-principles.md` | Active (principles) | Principles guide all Phase 1-5 decisions |
| `commercial-strategy.md` | Active (business) | Business model unchanged; NoCode expands TAM |
| `vulca-prototype-plan-v2.md` | Archive | Historical reference for engine development |

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **Intent** | Structured representation of user's natural language request |
| **Skill** | Executable evaluation capability unit (replaces fixed L1-L5 as the only option) |
| **Skill Pack** | Bundle of related skills (e.g., "Traditional Culture" = L1-L5 + tradition detection + taboos) |
| **Context** | User intent + target audience + use case + preferences + contemporary aesthetics |
| **Result Card** | Default NoCode output: score + summary + risks + suggestions |
| **Flow View** | React Flow visualization of the executed pipeline (Layer 1) |
| **Code View** | Python/YAML/curl equivalent of the evaluation (Layer 2) |
| **X-Ray Principle** | System must always show what it did, even in NoCode mode |
| **Progressive Disclosure** | Layer 0 (NoCode) → Layer 1 (Flow) → Layer 2 (Code) → Layer 3 (Framework) |
| **Self-Evolution** | System improves from user feedback: implicit, explicit, knowledge, skill creation |
| **MetaOrchestrator** | Top-level entry point that wraps IntentAgent + SkillSelector + PipelineOrchestrator |
| **ConfigTranslator** | Bridge between Intent Layer (SkillPlan) and Pipeline Engine (PipelineConfig) |
