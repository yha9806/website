# VULCA Self-Evolution Architecture: Research & Design

> Date: 2026-03-07
> Based on: 40+ projects/papers research (Skill Marketplaces + Agent RL)
> Purpose: Inform Phase 3-5 of `implementation-strategy-v4.md`
> Related: `strategic-pivot-nocode-2026-03-07.md` (vision)

---

## 1. Two Pillars of Self-Evolution

VULCA's self-evolution has two distinct mechanisms:

| Pillar | Description | Source of Improvement | Speed |
|--------|-------------|----------------------|-------|
| **Community Skills** | Users create/upload/rate Skills | Human knowledge contribution | Days-weeks |
| **Agent RL** | System learns from experience to improve evaluation | Automated learning | Continuous |

Both are needed. Community Skills provide breadth (new evaluation dimensions), Agent RL provides depth (better accuracy on existing dimensions).

---

## 2. Skill Marketplace: Key References

### 2.1 The SKILL.md Standard (Anthropic, 2025-12)

**The de facto cross-platform standard for skill definition.**

- URL: https://github.com/anthropics/skills
- Adopted by: OpenAI Codex CLI, ChatGPT, Manus AI, OpenClaw
- Format: YAML frontmatter + Markdown body

```yaml
---
name: my-skill-name
description: A clear description of what this skill does
---
# My Skill Name
[Instructions that the agent follows]
```

**Key design principles:**
- **Progressive Disclosure**: Agent first loads metadata (name + description), only loads full instructions when matched to user request. Saves context window.
- **Zero code required**: Pure text = lowest possible contribution barrier
- **Cross-platform**: Same skill works in Claude Code, Codex, Manus, etc.

**VULCA implication**: Our Skill YAML format should be compatible with or inspired by SKILL.md. This gives us cross-platform visibility — a VULCA evaluation Skill could work in Claude Code, Codex, etc.

### 2.2 OpenClaw + ClawHub (247K stars, 13,729+ skills)

**The most successful community skill platform to date.**

- URL: https://openclaw.ai / https://clawhub.ai
- Founded by Peter Steinberger (acquired by OpenAI, 2026-02)
- Growth: 0 → 247K stars in ~3 months
- Skills: 13,729+ published, ~66,500 aggregated by SkillsMP

**What makes it work:**
1. **Extreme low barrier**: Write a SKILL.md file, run `clawhub publish <path>`. Done.
2. **Vector search discovery**: Embedding-based semantic search, not just keywords
3. **Version control**: Each publish = new semver version, full history
4. **Security**: VirusTotal partnership for scanning, 1-week account age requirement
5. **Instant effect**: Published skill is immediately usable by all agents

**VULCA application:**
- Our Skill publishing should be similarly simple: write YAML → `vulca publish` or PR to `skills/`
- Discovery should use vector search (we already have FAISS in ScoutService)
- Version history enables rollback and A/B testing

### 2.3 Dify Plugin Marketplace (133K stars, 120+ plugins)

**The most complete "App Store" model for AI capabilities.**

- URL: https://marketplace.dify.ai
- Plugin types: Models / Tools / Agent Strategies / Extensions / Bundles
- Distribution: 3 channels — Official marketplace (code review) / GitHub (no review) / Local file

**Quality control (best-in-class):**
1. Every marketplace plugin undergoes strict code review
2. Sandboxed execution (isolated runtime)
3. Explicit permission declarations (what data the plugin accesses)
4. Explicit data handling declarations

**VULCA application:**
- Three-tier distribution: Official (reviewed) / Community (CI-validated) / Local (personal)
- Permission model: Skills should declare what data they access (image only? user data? external API?)
- Sandbox: Skills should run in isolated context (important for user-contributed logic)

### 2.4 Smithery (100K+ AI Skills)

- URL: https://smithery.ai
- MCP protocol integration
- Community review system — agents discover quality skills through reviews

**VULCA application:** MCP compatibility could let VULCA Skills be discovered by other agent platforms.

### 2.5 ComfyUI Registry (800+ authors)

- URL: https://registry.comfy.org
- **Critical lesson**: 2025 malicious node incident (crypto miners + credential theft)
  - Response: Trusted Developer Badge, enhanced code review, security audit
- Semantic versioning, unique namespace

**VULCA application:** Security scanning is non-negotiable for community skills. VirusTotal-style scan + CI validation + human review for "Featured" skills.

### 2.6 Pattern Summary: What Works

| Pattern | Evidence | VULCA Adoption |
|---------|----------|---------------|
| **SKILL.md / YAML format** | Anthropic standard, adopted by 5+ platforms | YES — our Skill YAML is already similar |
| **Progressive Disclosure** | SKILL.md spec, saves context window | YES — load metadata first, full logic on demand |
| **Vector search discovery** | ClawHub, SkillsMP | YES — reuse existing FAISS infrastructure |
| **Three-tier distribution** | Dify (official/github/local) | YES — Featured/Community/Personal |
| **Security scanning** | ComfyUI incident, VirusTotal partnership | YES — CI validation + malicious pattern detection |
| **Version control** | ClawHub (semver), Dify (.difypkg) | YES — git-based versioning |
| **Community ratings** | Smithery reviews, Coze competitions | YES — rating + usage count + "Hot" ranking |
| **Zero-code creation** | SKILL.md (pure text), Dify (visual) | YES — natural language logic description |

---

## 3. Agent RL / Self-Improvement: Key References

### 3.1 Voyager (MineDojo, 2023) -- The Foundational Architecture

**The project that started the "skill library" paradigm.**

- Paper: arXiv:2305.16291 | GitHub: MineDojo/Voyager
- Three components that form the reference architecture:

```
1. Automatic Curriculum: generates progressively harder tasks
   → maximizes exploration and learning progress

2. Skill Library: stores learned skills as executable code
   → persistent, reusable across contexts/worlds
   → retrieval by description embedding (vector search)

3. Iterative Prompting: environment feedback + self-verification
   → skill is only added to library if it passes verification
```

**VULCA parallel:**
```
Voyager                          VULCA Self-Evolution
────────                         ────────────────────
Automatic Curriculum        →    Auto-generate evaluation test cases
Skill Library (JS code)     →    Skill Registry (YAML + VLM prompts)
Environment Feedback        →    User feedback (thumbs up/down, score override)
Self-Verification           →    Cross-validation (compare with expert scores)
Vector Retrieval            →    Semantic skill discovery (FAISS)
```

### 3.2 SkillRL (2026-02) -- Hierarchical Skill Bank

**Most directly applicable to evaluation systems.**

- Paper: arXiv:2602.08234 | GitHub: aiming-lab/SkillRL
- SOTA, +15.3% over baselines

**Core mechanism:**
```
Experience Distillation:
  Success trajectories → extract strategy patterns ("what worked")
  Failure trajectories → extract lessons ("what went wrong")

Hierarchical SkillBank:
  General Skills: apply across all evaluation contexts
  Task-Specific Skills: apply to specific traditions/scenarios

RL Co-Evolution:
  Skills and policy co-evolve during training
  Skills that improve reward get reinforced
  Skills that decrease reward get demoted/removed
```

**VULCA application:**
```python
# Evaluation SkillBank structure
skill_bank = {
    "general": [
        # Skills that work across all evaluations
        "visual_composition_check",      # "Check rule of thirds, visual balance"
        "color_harmony_analysis",        # "Analyze color palette coherence"
    ],
    "task_specific": {
        "japanese_traditional": [
            "ma_space_detection",         # "Check for intentional empty space (ma)"
            "wabi_sabi_assessment",        # "Evaluate wabi-sabi aesthetic markers"
        ],
        "brand_consistency": [
            "palette_extraction_compare",  # "Extract dominant colors, compare to brand"
        ],
    }
}

# Evolution loop:
# 1. Run evaluation with current skills
# 2. Collect user feedback (thumbs up/down)
# 3. If thumbs up → reinforce skill weights
# 4. If thumbs down → distill what went wrong → generate improved skill
# 5. Periodically promote task-specific skills that work broadly → general
```

### 3.3 AutoSkill (2026-03) -- SKILL.md for Agent Learning

**Bridges the gap between community skills and agent learning.**

- Paper: arXiv:2603.01145 | GitHub: ECNU-ICALK/AutoSkill

**Core innovation: Standardized skill artifacts from experience.**
```
Interaction traces → Automatic extraction → SKILL.md artifacts

Artifact types:
  - Style constraints ("always use warm tone for food photography evaluation")
  - Response strategies ("when score < 0.5, provide specific improvement steps")
  - Tool usage procedures ("for brand check: extract palette → compare → score")
  - Domain conventions ("in Islamic art, geometric precision > organic flow")
```

**VULCA application:**
- System automatically generates SKILL.md files from successful evaluations
- These auto-generated skills can be reviewed and promoted to community skills
- Model-agnostic: skills work regardless of underlying VLM

### 3.4 SafeEvalAgent -- Self-Evolving Evaluation (Directly Relevant!)

**An evaluation system that evolves its own evaluation criteria.**

- Paper: arXiv:2509.26100

**Architecture:**
```
Specialist Agent: regulations/standards → structured knowledge base
Generator Agent: knowledge base → generate test suite
Evaluator Agent: run tests → score results
Analyst Agent: analyze failures → identify weak spots
Generator Agent (again): create harder tests targeting weak spots
→ Iterate: evaluation criteria deepen with each cycle
```

**Key finding:** GPT-5's safety rate dropped from 72.50% to 36.36% as evaluation criteria self-evolved — proving that static evaluation misses issues that evolving evaluation catches.

**VULCA application:**
```
Cultural Expert (our Scout)  → cultural knowledge base (terms, taboos, examples)
Test Generator               → generate challenging evaluation scenarios
VLM Critic                   → evaluate + score
Analyst                      → identify where VLM is weak/wrong (user feedback signals)
Skill Updater                → create better evaluation prompts/skills for weak areas
→ Iterate: cultural evaluation gets deeper and more accurate
```

### 3.5 Agent Lightning (Microsoft, 2025-08) -- Zero-Code RL Plugin

**The most practically useful: add RL to any existing agent without code changes.**

- Paper: arXiv:2508.03680 | GitHub: microsoft/agent-lightning
- Works with LangChain, AutoGen, OpenAI SDK — and by extension, LangGraph

**How it works:**
```
1. Intercept agent execution as MDP transitions
2. Apply hierarchical RL algorithm (LightningRL)
3. Credit assignment: which agent action contributed to final reward
4. Update policy without touching agent code

Agent code (unchanged)  ←→  Agent Lightning (RL wrapper)
  Scout                         records transitions
  Critic                        computes rewards
  Queen                         updates policy
```

**VULCA application:**
- Wrap existing PipelineOrchestrator with Agent Lightning
- Use user feedback (thumbs up/down) as reward signal
- System automatically learns which evaluation strategies produce user-approved results
- **Zero changes to Scout, Critic, Queen code**

### 3.6 EvoAgentX (EMNLP 2025 Demo, 2.5K stars)

**Auto-evolve agent workflows from natural language goals.**

- GitHub: EvoAgentX/EvoAgentX
- Three optimization algorithms: TextGrad, AFlow, MIPRO

**Three evolution dimensions:**
```
Topology Evolution:   change which agents collaborate and in what order
Prompt Optimization:  refine agent instructions automatically
Memory Adaptation:    update knowledge base from experience
```

**VULCA application:**
- Define evaluation goal in natural language: "Improve L3 (Cultural Context) accuracy for Japanese art"
- EvoAgentX auto-optimizes: Scout search terms, Critic prompt, weight distribution
- No manual tuning needed

### 3.7 MemRL (2026-01) -- Frozen Model + Evolving Memory

**Production-friendly: model stays fixed, memory improves.**

- Paper: arXiv:2601.03192 | GitHub: MemTensor/MemRL

**Why this matters for production:**
```
Problem: You can't retrain Gemini (it's an API)
Solution: Keep Gemini frozen, but evolve WHAT you feed it

MemRL approach:
  Phase A: Semantic retrieval (find relevant past experiences)
  Phase B: Q-value based utility selection (pick experiences that actually helped)

Over time: the memory becomes a curated set of "best evaluation strategies"
           without any model weight changes
```

**VULCA application:**
- VLMCritic uses Gemini API (frozen, can't train)
- But we can evolve the "evaluation memory": which prompts worked, which examples helped, which context led to user-approved scores
- MemRL's two-phase retrieval maps to: ScoutService (Phase A) + learned utility ranking (Phase B)

### 3.8 EvolveR -- Experience Distillation to Principles

- Paper: arXiv:2510.16079

**Core insight: Don't store raw trajectories, distill them into abstract principles.**

```
Raw trajectory:  "For task X with tradition Y, I scored L1=0.85, user said too low"
Distilled principle: "When evaluating xieyi brushwork (L1), weight spontaneity over precision.
                      Users consistently rate expressive strokes higher than technically accurate ones."

Why principles > trajectories:
  - Smaller storage (text vs. full execution log)
  - Better generalization (applies to new similar cases)
  - Human-readable (experts can review and curate)
```

**VULCA application:**
- After 100 evaluations with user feedback, distill into principles:
  - "Japanese market users care more about color harmony than cultural accuracy"
  - "Brand teams want specific color hex codes in violation reports, not just descriptions"
  - "Gen Z audience checks value 'vibe' over technical composition"
- These principles become inputs to SkillSelector and VLMCritic prompts

---

## 4. Recommended Architecture for VULCA Self-Evolution

### 4.1 Three-Layer Evolution Model

```
Layer 1: Community Skills (Human-driven, explicit)
  ├── User creates Skill YAML (SKILL.md compatible)
  ├── CI validates (schema, safety scan)
  ├── Community rates (usage count, thumbs up/down)
  ├── Popular skills surface to "Featured"
  └── Reference: OpenClaw/ClawHub + Dify marketplace

Layer 2: Feedback-Driven Adaptation (Hybrid, semi-automatic)
  ├── Implicit feedback: which results user keeps/discards
  ├── Explicit feedback: thumbs up/down, score override
  ├── Distill feedback into evaluation principles (EvolveR pattern)
  ├── Adjust skill weights per-user and per-context
  └── Reference: SkillRL hierarchical bank + EvolveR distillation

Layer 3: Agent Self-Improvement (Automated, continuous)
  ├── SafeEvalAgent pattern: iteratively deepen evaluation criteria
  ├── MemRL pattern: evolve evaluation memory without model changes
  ├── Auto-generate new evaluation test cases from failures
  ├── Promote successful strategies from task-specific → general
  └── Reference: SafeEvalAgent + MemRL + Agent Lightning
```

### 4.2 Concrete Implementation Map

#### Phase 3 (Weeks 3-5): Community Skills Foundation

```
What to build:
  1. Skill YAML format (SKILL.md compatible)
  2. SkillRegistry with vector search (reuse FAISS)
  3. Skill validation pipeline (CI + safety scan)
  4. 3 built-in non-cultural Skills
  5. `vulca publish` CLI command

Key files:
  skills/
  ├── schema.json                    # JSON Schema for Skill YAML validation
  ├── skill_types.py                 # Skill, SkillPack, SkillConfig
  ├── skill_loader.py                # Load from YAML + built-in + registry
  ├── skill_validator.py             # Schema + safety + format validation
  ├── skill_search.py                # FAISS-based semantic skill discovery
  ├── yaml/
  │   ├── brand_consistency.yaml     # Non-cultural skill
  │   ├── audience_fit.yaml          # Non-cultural skill
  │   ├── trend_match.yaml           # Non-cultural skill
  │   └── _skill_template.yaml       # Template for community contributors
  └── skill-packs/
      └── traditional_culture.yaml   # L1-L5 as a Skill Pack
```

#### Phase 4 (Weeks 5-7): Feedback-Driven Adaptation

```
What to build:
  1. FeedbackCollector (JSONL events → append-only log)
  2. FeedbackAnalyzer (aggregate signals → per-user/context weights)
  3. PrincipleDistiller (raw feedback → abstract evaluation principles)
     → EvolveR pattern: "users in X context prefer Y approach"
  4. PreferenceModel (per-user weight adjustments at SkillSelector level)
  5. Feedback dashboard (admin view: trends, accuracy, satisfaction)

Key files:
  intent/
  ├── feedback_collector.py          # Record run + explicit feedback
  ├── feedback_analyzer.py           # Aggregate → signals
  ├── principle_distiller.py         # Raw → abstract principles (Gemini call)
  └── preference_model.py            # Per-user JSON: {skill_weights, prefs}

Evolution loop:
  Every 50 evaluations with feedback:
    1. Aggregate thumbs up/down per skill per context
    2. If skill accuracy < 70% in a context → flag for review
    3. Distill user overrides into evaluation principles
    4. Inject principles into SkillSelector rule matching
    5. Notify admin dashboard of drifts
```

#### Phase 5 (Weeks 7-10): Skill Marketplace + Auto-Generation

```
What to build:
  1. Marketplace UI (browse, search, install, rate)
  2. Skill Creator wizard (natural language → YAML → preview → publish)
  3. Auto-Skill generation (from successful evaluations → candidate Skills)
     → AutoSkill pattern: interaction traces → SKILL.md artifacts
  4. SafeEvalAgent-inspired deepening loop (optional, advanced)

Key files:
  skills/
  ├── skill_generator.py             # NL → Skill YAML (Gemini)
  ├── auto_skill_extractor.py        # Successful evals → candidate skills
  └── deepening_loop.py              # SafeEvalAgent pattern (future)

  api/
  ├── skill_routes.py                # CRUD + rating + publish

  frontend:
  ├── pages/SkillMarketplace.tsx     # Browse/search/install/rate
  ├── components/skills/
  │   ├── SkillCard.tsx              # Card with name, rating, usage
  │   ├── SkillCreator.tsx           # NL → YAML wizard
  │   └── SkillDetail.tsx            # Full skill view + reviews
```

### 4.3 Auto-Skill Generation Flow

```
User evaluates image → VLMCritic returns L1-L5 scores
User gives thumbs up ✓

After 20+ thumbs-up evaluations for similar context:
  1. AutoSkillExtractor groups by context (tradition, audience, use case)
  2. Extracts common patterns:
     - Which VLM prompt elements consistently got good feedback
     - Which weight configurations users preferred
     - Which suggestions users found helpful
  3. Generates candidate Skill YAML:
     ---
     name: japanese_market_visual_check
     description: "Optimized evaluation for Japanese market visual content"
     auto_generated: true
     source_evaluations: 23
     confidence: 0.87
     ---
     # Japanese Market Visual Check
     Based on 23 user-validated evaluations:
     1. Prioritize color harmony and minimalist composition (L1)
     2. Check for unintentional religious symbol usage (taboo)
     3. Verify text readability in vertical/horizontal layouts
     4. Assess "kawaii" aesthetic alignment for youth-targeted content
  4. Candidate appears in admin dashboard for review
  5. Admin approves → published to marketplace as "Auto-Generated" skill
  6. Community can rate/improve the auto-generated skill
```

### 4.4 Agent Self-Improvement Flow (MemRL + Agent Lightning pattern)

```
Phase A: Evaluation Memory Evolution (MemRL pattern)
  ─────────────────────────────────────────────────

  Gemini API (frozen, can't train)
  BUT we control what we feed it:
    - System prompt → evolves based on feedback
    - Few-shot examples → curated from best evaluations
    - Cultural context → enriched from user corrections

  Memory Bank:
    evaluation_memory = {
        "japanese_traditional": {
            "best_prompts": [...],      # VLM prompts that got user approval
            "few_shot_examples": [...], # Image + score pairs users validated
            "principles": [...],        # Distilled evaluation principles
            "anti_patterns": [...]      # Approaches that got negative feedback
        }
    }

  Update rule:
    After each user feedback:
      if thumbs_up: add current prompt/approach to "best_prompts"
      if thumbs_down: add to "anti_patterns", analyze why
      if score_override: record delta, extract principle

Phase B: Skill Weight Evolution (Agent Lightning inspired)
  ─────────────────────────────────────────────────────────

  Track: which skills produce user-approved results in which contexts

  skill_performance = {
      "cultural_evaluation": {
          "japanese_traditional": {"approve_rate": 0.87, "n": 45},
          "brand_check": {"approve_rate": 0.62, "n": 12},
      },
      "brand_consistency": {
          "brand_check": {"approve_rate": 0.91, "n": 30},
      }
  }

  Adjustment rule:
    SkillSelector boosts skills with high approve_rate for matching contexts
    SkillSelector warns when using skills with low approve_rate
    Skills with <50% approve_rate after 20+ evaluations → flagged for review
```

---

## 5. SKILL.md Compatibility Design

### 5.1 VULCA Skill Format (compatible with Anthropic SKILL.md)

```yaml
---
# SKILL.md compatible frontmatter
name: japanese-market-visual-check
description: "Evaluate AI-generated images for Japanese market appropriateness"
version: "1.2.0"
author: "@yhryzy"
tags: [evaluation, cultural, japanese, market]
auto_generated: false

# VULCA-specific extensions
vulca:
  type: evaluation          # evaluation | identification | comparison | risk_check
  input_types: [image]      # image | video | audio | text
  output_types: [scores, suggestions, risks]
  requires_vlm: true
  skill_pack: null           # or "traditional_culture"
  min_confidence: 0.7
---

# Japanese Market Visual Check

## When to use
This skill should be activated when the user's target market includes Japan
or when Japanese cultural elements are detected in the image.

## Evaluation Logic
1. **Color harmony analysis**: Japanese market prefers muted, natural color palettes.
   High saturation is acceptable for youth-targeted content (kawaii aesthetic).
2. **Symbol sensitivity scan**: Check for unintentional religious symbols
   (torii gates, Buddhist imagery) in commercial contexts.
3. **Layout assessment**: Verify text readability in both vertical and
   horizontal orientations. Japanese design favors asymmetric balance.
4. **Cultural appropriateness**: Distinguish between appreciation and
   appropriation. Look for stereotypical representations.

## Scoring Weights
- Visual harmony: 0.25
- Cultural sensitivity: 0.30
- Layout & readability: 0.20
- Aesthetic fit: 0.25

## Examples
- GOOD: Minimalist product photo with natural lighting, subtle seasonal reference
- BAD: Cherry blossom overload with samurai imagery for a tech product
- EDGE: Anime-style illustration — acceptable for youth market, not for luxury brands
```

### 5.2 Cross-Platform Benefit

Because our format is SKILL.md compatible:
- A VULCA Skill can be discovered by Claude Code, Codex CLI, Manus
- A Skill created in another platform can be imported into VULCA
- This multiplies our skill library reach without extra development

---

## 6. Risk Analysis for Self-Evolution

| Risk | Severity | Mitigation | Reference |
|------|----------|------------|-----------|
| **Malicious skills** (code injection, data theft) | High | CI validation + security scan + sandbox + human review for Featured | ComfyUI incident |
| **Skill quality degradation** (AI slop from auto-generation) | Medium | Auto-generated skills require admin approval; community rating filters | GitHub AI contribution reports |
| **Feedback manipulation** (gaming ratings) | Medium | Weight by user trust score; require minimum evaluations before voting | Standard marketplace practice |
| **Preference drift** (system optimizes for approval, not accuracy) | Medium | Keep "expert-validated" skills as anchors; L1-L5 as ground truth baseline | SafeEvalAgent finding |
| **Echo chamber** (system reinforces biases) | Medium | Periodic diversity audit; cross-context skill validation | EvolveR principle diversity |
| **Privacy** (feedback data contains user patterns) | Low | Aggregate before analysis; per-user data deletable; GDPR-ready | Standard practice |

---

## 7. Implementation Priority (Updated)

Based on research, the recommended implementation order:

| Priority | Component | Reference | Effort | Impact |
|----------|-----------|-----------|--------|--------|
| **P0** | Skill YAML format (SKILL.md compatible) | Anthropic spec + OpenClaw | 2 days | Foundation for everything |
| **P0** | SkillRegistry + vector search | ClawHub + existing FAISS | 3 days | Skill discovery |
| **P1** | FeedbackCollector (JSONL events) | SkillRL feedback loop | 1 day | Data collection |
| **P1** | 3 non-cultural Skills (brand/audience/trend) | Built-in skills | 3 days | Prove extensibility |
| **P1** | Evaluation memory evolution (MemRL pattern) | MemRL + frozen Gemini | 3 days | Auto-improvement |
| **P2** | PrincipleDistiller (EvolveR pattern) | EvolveR | 2 days | Feedback → principles |
| **P2** | Marketplace UI + ratings | Dify + ClawHub | 5 days | Community |
| **P2** | Skill Creator wizard (NL → YAML) | AutoSkill | 3 days | Low-barrier creation |
| **P3** | Auto-Skill extraction from evaluations | AutoSkill + SkillRL | 5 days | System generates skills |
| **P3** | SafeEvalAgent deepening loop | SafeEvalAgent | 5 days | Criteria evolution |
| **P3** | Agent Lightning-style RL wrapper | Agent Lightning | 7 days | Model-level improvement |

---

## 8. Key Takeaways

### From Skill Marketplace Research:
1. **SKILL.md is the standard** — adopt it, don't invent a new format
2. **Vector search for discovery** — we already have FAISS, reuse it
3. **Three-tier distribution** — Featured (reviewed) / Community (CI) / Personal (local)
4. **Security is non-negotiable** — learn from ComfyUI's malicious node incident
5. **Lowest possible barrier** — natural language skill creation, not just YAML

### From Agent RL Research:
1. **Don't retrain the model, evolve the memory** — MemRL pattern fits our Gemini API constraint
2. **Distill experiences into principles, not raw logs** — EvolveR pattern for human-readable evolution
3. **Hierarchical skill bank** — general skills + task-specific skills (SkillRL)
4. **Evaluation systems should self-evolve their criteria** — SafeEvalAgent proves this works
5. **Zero-code RL is possible** — Agent Lightning can wrap existing agents without code changes
6. **Auto-generate skills from success patterns** — AutoSkill + SkillRL show this is practical

### The VULCA-Specific Insight:
```
We can't train Gemini (it's an API).
But we can evolve EVERYTHING we feed Gemini:
  - Which prompt to use (evaluation memory)
  - Which examples to show (few-shot curation)
  - Which weights to apply (preference model)
  - Which skills to activate (SkillSelector rules)
  - Which principles to inject (distilled from feedback)

This is "frozen model + evolving context" = MemRL for evaluation.
```

---

## Sources

### Skill Marketplace
- [Anthropic Agent Skills Spec](https://github.com/anthropics/skills)
- [OpenClaw / ClawHub](https://openclaw.ai) — 247K stars, 13,729+ skills
- [Dify Plugin Marketplace](https://marketplace.dify.ai) — 133K stars, code-reviewed plugins
- [Smithery](https://smithery.ai) — 100K+ skills, MCP integration
- [SkillsMP](https://skillsmp.com) — 66,500+ aggregated skills
- [ComfyUI Registry](https://registry.comfy.org) — malicious node incident → security upgrade
- [LobeHub](https://lobehub.com) — Agent + Skills + MCP marketplace
- [n8n Community Nodes](https://community.n8n.io) — 5,834 nodes, npm-based
- [MCP Registry](https://registry.modelcontextprotocol.io) — official tool discovery

### Agent RL / Self-Improvement
- [Voyager](https://voyager.minedojo.org/) — foundational skill library architecture (2023)
- [SkillRL](https://arxiv.org/abs/2602.08234) — hierarchical SkillBank + RL co-evolution (2026-02)
- [AutoSkill](https://arxiv.org/abs/2603.01145) — SKILL.md from interaction traces (2026-03)
- [SafeEvalAgent](https://arxiv.org/abs/2509.26100) — self-evolving evaluation criteria
- [Agent Lightning](https://arxiv.org/abs/2508.03680) — zero-code RL for existing agents (Microsoft)
- [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) — NL goal → auto-optimize workflow (EMNLP 2025)
- [MemRL](https://arxiv.org/abs/2601.03192) — frozen model + evolving memory (2026-01)
- [EvolveR](https://arxiv.org/abs/2510.16079) — experience → abstract principles
- [Agent0](https://arxiv.org/abs/2511.16043) — self-evolution from zero data
- [SAGE](https://arxiv.org/abs/2512.17102) — skill-augmented GRPO
- [Agent-R1](https://arxiv.org/abs/2511.14460) — end-to-end RL for agents
- [Absolute Zero](https://arxiv.org/abs/2505.03335) — self-generated curriculum (NeurIPS 2025)
- [CRADLE](https://github.com/BAAI-Agents/Cradle) — general computer control (ICML 2025)
- [Survey: Self-Evolving AI Agents](https://arxiv.org/abs/2508.07407)
- [Survey: Self-Evolving Agents What/When/How](https://arxiv.org/abs/2507.21046)
