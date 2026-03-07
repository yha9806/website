# VULCA Strategic Pivot: NoCode + Self-Evolving Quality Intelligence

> Date: 2026-03-07
> Status: Strategic Direction Confirmed
> Supersedes: Previous "Workflow + TRADITION.yaml" approach
> Implementation Plan: `implementation-strategy-v4.md` (Phase 1-5, file lists, code architecture, timeline)

## 1. Core Problem Diagnosis

### What's Wrong with Current VULCA

The current product defines "what is good" through expert rules (L1-L5 x 9 traditions x 47 dimensions). This creates three fatal constraints:

1. **Too rigid**: Fixed evaluation dimensions don't adapt to user context
2. **Too narrow**: "Traditional culture" limits market to a few thousand scholars/artists
3. **Too high barrier**: Node-based workflow (M3 Canvas) still requires understanding pipeline concepts

```
Current model (broken):
  Expert defines rules (YAML) --> Fixed pipeline evaluates --> Tells user "your image doesn't match Song dynasty standards"
                                                                User: "I don't need Song dynasty standards.
                                                                       I need this to look good on TikTok."

Target model:
  User brings context (intent + audience + scene + preferences)
    --> System understands context --> Dynamic evaluation --> Continuous evolution
                                                              "Not us telling user what's right,
                                                               but user teaching the system what they need."
```

### Market Ceiling Problem

```
"Does this shanshui painting follow Song dynasty tradition?"
  --> People who care: thousands (scholars + artists)

"Does this AI-generated content make sense? Is it appropriate? Does it fit my needs?"
  --> People who care: everyone using AI generation (hundreds of millions)
```

### Real User Scenarios the Current System Can't Handle

| User says | They actually need | Current VULCA handles? |
|-----------|-------------------|----------------------|
| "This looks off" | Composition/tone/atmosphere intuition validation | Partially (L1-L2) |
| "Would Japanese clients find this weird?" | Cultural context adaptation | Yes (but only 9 traditions) |
| "This video pacing is flat" | Narrative rhythm / emotional curve | No (images only) |
| "I want cyberpunk but with Chinese aesthetics" | Style mixing reasonableness | No (traditions are mutually exclusive) |
| "What does Gen Z consider aesthetic?" | Contemporary trend perception | No (historical traditions only) |
| "Is this on-brand?" | Brand consistency + audience match | No |

## 2. The Paradigm Shift

### From "Rule-based Evaluation" to "Context-aware Intelligence"

| Dimension | Old Paradigm (Current) | New Paradigm (Target) |
|-----------|----------------------|----------------------|
| **Knowledge Source** | Expert-predefined (YAML) | User experience + community + expert seed |
| **Evaluation Standard** | Fixed (9 traditions x 47 dims) | Dynamic (user-defined context) |
| **Feedback Direction** | System --> User ("you're wrong") | User --> System ("I think it should be like this") |
| **Scope** | Traditional cultural art | All AI-generated content (image/video/audio) |
| **Evolution** | Maintainer updates YAML | Self-evolving: user behavior --> model updates |
| **Interaction** | Workflow (configure nodes --> run) | NoCode (describe intent --> system executes) |

### "Context" Replaces "Tradition"

Current model:
```
Tradition = fixed set of cultural rules
User selects one tradition --> evaluate by rules
```

New model:
```
Context = user intent + target audience + use case + personal preferences + contemporary aesthetics
System understands context --> dynamically assembles evaluation criteria --> evaluates --> user feedback --> system evolves
```

Example:
```
User: "I'm making visuals for a bubble tea brand targeting Southeast Asian Gen Z"

System-understood context:
  - Target audience: 18-25, Southeast Asia, mobile-first
  - Visual preference: high saturation, cartoonish, meme-friendly, Instagram aesthetic
  - Cultural considerations: avoid specific religious symbols, food color preferences
  - Brand tone: young, energetic, social-sharing

Dynamically assembled evaluation dimensions:
  - Color vibrancy (replaces L1 traditional brushwork evaluation)
  - Social shareability (entirely new dimension)
  - Cultural risk scan (retained, but broader scope)
  - Brand consistency (entirely new dimension)
  - Mobile readability (entirely new dimension)
```

**L1-L5 is not discarded -- it becomes one "preset context"** among many. When the user's scenario happens to be traditional cultural art, the system auto-loads the L1-L5 framework. But that's just one of infinite possible contexts.

## 3. Three Generations of Product Interaction

### Generation 1 -- Code (developers only)
```python
pip install vulca
result = vulca.evaluate(image, tradition="chinese_shanshui")
# Only developers can use
```

### Generation 2 -- Workflow / Low-Code (current VULCA, also ComfyUI/n8n)
```
User drags nodes on canvas --> connects wires --> configures params --> runs
# Requires understanding pipeline concepts, barrier still high
```

### Generation 3 -- NoCode / Intent-driven (target)
```
User: "Check if these images work for the Japanese market"
System: auto-selects node combination --> executes --> returns results
# Describe intent, zero learning cost
```

### CRITICAL: NoCode Does NOT Mean No Code Option

The three generations coexist as a **progressive disclosure stack**:

```
Layer 0 -- Natural Language (NoCode, default)
  "Check this image for cultural issues in Japan"
  --> Meta-Agent understands --> auto-orchestrates --> returns results
  --> User sees: clean result card with score + suggestions
  --> ALSO sees: "Show me how this was done" toggle

Layer 1 -- Visual Flow (Low-Code, opt-in)
  User clicks "Show flow" --> sees the auto-generated pipeline
  --> Can inspect each step: what the system did, what data flowed
  --> Can modify: drag new nodes, change connections, adjust params
  --> This is the current M3 Canvas, but as inspection/customization layer

Layer 2 -- Code (Pro/Developer, opt-in)
  User clicks "Export as code" or "Edit as code" on any node
  --> Gets Python/YAML/JSON representation
  --> Can write custom Skills, custom Agents, custom evaluation logic
  --> REST API + SDK for programmatic access (M4 B2B API, unchanged)
  --> ComfyUI nodes, n8n integrations, CLI tools

Layer 3 -- Framework (Researcher/Contributor)
  Full access to vulca-core source code
  Write TRADITION.yaml or SKILL definitions
  Contribute to open-source framework
  Run ablation experiments, extend evaluation dimensions
```

**The key insight: Every action at Layer 0 generates a visible Layer 1 flow. Users can always "peek behind the curtain" and progressively take control.**

This is inspired by:
- **Cursor/Claude Code**: AI writes code, but user can see and edit every line
- **n8n**: Visual workflow, but every node can be inspected/customized
- **Figma**: Direct manipulation, but inspect panel shows CSS/code
- **Excel**: Cells have formulas underneath; most users never see them, power users live in them

## 4. Architecture: Intent Layer on Top of Existing Engine

### What Changes

```
NEW (to build):
  Intent Parser --> Context Builder --> Skill Selector --> Agent Orchestrator
  User Preference Model (learns from feedback)
  Skill Registry (community-contributed capabilities)
  Flow Visualizer (auto-generated pipeline view)

EXISTING (keeps working):
  LangGraph pipeline engine
  Scout/Router/Draft/Critic/Queen agents
  VLM Critic (becomes one Skill)
  Cultural Router (becomes one module in Context Builder)
  REST API (unchanged, infrastructure layer)
  SSE event stream (powers flow visualization)
  React Flow canvas (becomes inspection/customization layer)
```

### Agent Architecture Evolution

Current (5 fixed agents):
```
Scout --> Router --> Draft --> Critic --> Queen --> Archivist
(rigid, always same sequence, always same agents)
```

New (3 core + extensible):
```
Core Agents (platform-provided, always available):
  - Orchestrator: understands user intent, selects & composes Skills
  - Evaluator: executes evaluation (calls selected Skills in parallel/sequence)
  - Advisor: generates actionable improvement suggestions

Extensible Agents (community-contributed):
  - Brand Guardian: maintains brand consistency
  - Cultural Advisor: traditional culture expert (original capability, now one of many)
  - Trend Analyst: tracks contemporary aesthetic trends
  - Audience Simulator: "if I were a 20-year-old Japanese woman, how would I see this?"
  - Accessibility Checker: color blindness, readability, contrast
  - ...
```

## 5. Skill System (Replaces TRADITION.yaml)

### Why TRADITION.yaml is Too Narrow

Current limitations:
- Can only describe static rules (weights, terminology, taboos)
- Cannot execute dynamic logic ("if target audience is Gen Z, then...")
- Cannot handle multimodal (video rhythm, audio emotion)
- Name implies "traditional culture" -- scares away non-cultural users

### New: Skill = Executable Capability Unit

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
    - score: float  # 0-1 consistency score
    - suggestions: list[str]  # actionable improvements
    - violations: list[str]  # specific deviations found

  # Core: describe logic in natural language, system compiles to executable
  logic: |
    1. Extract image dominant colors, compare against brand palette
    2. Check if typography usage falls within brand font list
    3. Evaluate overall style match against brand tone description
    4. Output consistency score + specific deviation points

  tags: [brand, design, marketing]
  difficulty: beginner  # beginner | intermediate | advanced
```

### TRADITION.yaml Becomes a Skill Pack

```yaml
# skill-packs/traditional_culture.yaml
skill_pack:
  name: traditional_culture_evaluation
  description: "L1-L5 cultural evaluation framework (EMNLP 2025)"
  skills:
    - l1_visual_perception
    - l2_technical_analysis
    - l3_cultural_context
    - l4_critical_interpretation
    - l5_philosophical_aesthetics
    - tradition_identifier
    - taboo_detector
    - terminology_checker

  # The original 9 traditions become sub-configurations
  contexts:
    - chinese_shanshui
    - japanese_ukiyoe
    - korean_minhwa
    - ...
```

**Users don't need to write code.** Logic is described in natural language; the LLM interprets and executes. This is true NoCode.

### Skill Contribution Tiers

| Tier | What | How | Who |
|------|------|-----|-----|
| Use existing | Select Skills from marketplace | Click to add | Everyone |
| Configure | Adjust Skill parameters | Slider/toggle in UI | Curious users |
| Describe | Create Skill by describing logic in natural language | Text input | Domain experts (no code) |
| Code | Write Skill in Python with full API access | Code editor | Developers |
| Framework | Extend core evaluation engine | Fork + PR | Researchers |

## 6. Self-Evolution Mechanism

### Four Layers of Learning

```
Layer 1 -- Implicit Feedback (zero cost)
  Which image did user select? Downloaded? Skipped which suggestion?
  --> Preference signals auto-collected
  --> Adjusts future evaluations for this user/context

Layer 2 -- Explicit Feedback (low cost)
  "This score is too low" --> thumbs up/down
  "This suggestion wasn't helpful" --> flag
  --> Adjusts Skill weights in this context

Layer 3 -- Knowledge Contribution (medium cost)
  "In Thailand, white isn't appropriate for wedding-related designs"
  --> Natural language --> System extracts structured knowledge
  --> Community vote validates --> Added to knowledge base

Layer 4 -- Skill Creation (high cost, high value)
  "I do game concept art. I need an 'anime style reasonableness check'"
  --> User describes rules --> System generates Skill --> Publishes to community
```

### vs MJ Personalization

MJ V7 personalization: 85% of users adopt. Learns aesthetic preferences.

But MJ personalizes **generation** ("generate images matching my taste").
VULCA self-evolves **evaluation** ("judge by my standards what is good").

```
MJ personalization:     I like dark tones --> always generate dark tones
VULCA self-evolution:    My audience likes dark tones --> dark tones score higher
                         BUT cultural risk is still detected independently
                              ^
                         User preferences and objective risks are layered
```

## 7. Expanding Beyond "Traditional Culture"

### L1-L5 Becomes One Dimension Set Among Many

```
Evaluation Dimension Pool (continuously expanding):

Existing (academically validated):
  |-- L1 Visual Perception
  |-- L2 Technical Analysis
  |-- L3 Cultural Context         <-- Original strength, retained as "Classic Culture Pack"
  |-- L4 Critical Interpretation
  |-- L5 Philosophical Aesthetics

New (contemporary needs):
  |-- Aesthetic Trend Match       <-- "What's trending now"
  |-- Audience Fit                <-- "Will target demographic like this?"
  |-- Brand Consistency           <-- "Matches brand guidelines?"
  |-- Social Shareability         <-- "Would this go viral on Instagram/TikTok?"
  |-- Emotional Accuracy          <-- "Conveys intended emotion?"
  |-- Cross-Cultural Risk         <-- Expanded taboo detection (beyond traditional)
  |-- Usability/Readability       <-- "Readable on mobile screens?"
  |-- Narrative Coherence         <-- Video/multi-image scenarios
  |-- Audio-Visual Sync           <-- Video + audio scenarios
  |-- ... (community-defined)
```

### Contemporary Knowledge Sources

| Knowledge Type | Source | Update Frequency |
|---------------|--------|-----------------|
| Traditional culture rules | Expert + academic literature | Low (stable knowledge) |
| Contemporary aesthetic trends | Social media analysis + user feedback | High (monthly) |
| Brand guidelines | User upload | On-demand |
| Audience preferences | User behavior data + A/B testing | Continuous learning |
| Cross-cultural risks | News events + community reports | Event-driven |

### Multimodal Expansion Path

| Phase | Modality | Evaluation Capabilities |
|-------|----------|------------------------|
| Now | Image | L1-L5, cultural compliance, taboo detection |
| Next | Image + Context | Brand consistency, audience fit, trend match |
| Then | Video | Narrative coherence, pacing, emotional arc |
| Later | Audio | Tone appropriateness, cultural music fit |
| Future | Multi-modal | Audio-visual sync, cross-modal consistency |

## 8. New Product Positioning

### Old Positioning
> "Cultural quality framework for AI-generated visual content"
> Audience: scholars, cultural institutions (thousands)

### New Positioning
> "AI-native quality intelligence -- understand context, evaluate anything, evolve with users"
> Or simpler: "Does your AI output make sense? For your audience, your brand, your culture."
> Audience: all AI content creators (millions)

### Narrative Shift

```
Old story:
  "We have EMNLP papers + 47 dimensions + 9 traditions. We define cultural evaluation standards."
  --> Audience: academics, cultural institutions

New story:
  "AI generates more content every day, but nobody knows if it's right, good, or appropriate.
   You define what 'good' means for your context. The system checks it. The more you use it,
   the more accurate it gets. Traditional culture is our academic foundation, but our capability
   extends far beyond."
  --> Audience: all AI creators
```

## 9. Flow Visualization: The "X-Ray" Principle

### Users Must Be Able to See Everything

Even in NoCode mode, the system must show the full process. This is not optional -- it is a core product principle.

```
Default view (NoCode):
  +------------------------------------------+
  | "Check this image for Japanese market"    |
  |                                           |
  |  [Analyzing...]                           |
  |  > Identifying cultural context... done   |
  |  > Scanning for taboos... done            |
  |  > Evaluating aesthetic fit... done        |
  |                                           |
  |  Result: 7.8/10 - Generally safe          |
  |  2 suggestions, 0 critical risks          |
  |                                           |
  |  [Show detailed flow]  [Export report]    |
  +------------------------------------------+

Expanded view (click "Show detailed flow"):
  +------------------------------------------+
  | Pipeline Visualization (React Flow)       |
  |                                           |
  | [Context] --> [Tradition ID] --> [Scout]  |
  |                    |               |      |
  |              [japanese]    [3 evidence]    |
  |                    |               |      |
  |               [Evaluate] -----> [Report]  |
  |               L1: 0.82           |        |
  |               L2: 0.79      [Suggestions] |
  |               L3: 0.74                    |
  |                                           |
  |  Click any node to inspect/modify         |
  +------------------------------------------+

Code view (click "Export as code"):
  +------------------------------------------+
  | from vulca import evaluate                |
  |                                           |
  | result = evaluate(                        |
  |     image="input.png",                    |
  |     context={                             |
  |         "target_market": "japan",         |
  |         "audience": "general",            |
  |         "use_case": "marketing"           |
  |     },                                    |
  |     skills=["tradition_id", "taboo_scan", |
  |             "aesthetic_eval"]             |
  | )                                         |
  +------------------------------------------+
```

### Three Views, One Truth

| View | Target User | Shows | Editable? |
|------|------------|-------|-----------|
| **Result Card** | Everyone | Score + suggestions + risks | No (consume only) |
| **Flow View** | Curious / Pro users | Full pipeline with data at each step | Yes (drag nodes, change params) |
| **Code View** | Developers | Python/YAML/API call equivalent | Yes (full code editing) |

All three views reflect the same underlying execution. Editing in any view updates the others.

## 10. Impact on Existing Code Assets

Most existing code is **reusable with role changes**:

| Existing Asset | Current Role | New Role |
|---------------|-------------|----------|
| LangGraph pipeline | Fixed evaluation pipeline | **Underlying orchestration engine** (user doesn't directly touch) |
| React Flow canvas | User manually connects nodes | **Inspection/customization layer** (hidden by default, "Show flow") |
| VLM Critic | L1-L5 scorer | **One Skill in the Evaluator Agent's toolkit** |
| Scout knowledge base | Cultural terminology retrieval | **One data source for Knowledge Agent** |
| Cultural Router | 9-tradition fixed routing | **One module in Context Analyzer** |
| TRADITION.yaml | Only knowledge format | **One Skill Pack format** (alongside other formats) |
| REST API (M4) | B2B evaluation endpoint | **Unchanged** (infrastructure layer unaffected) |
| SSE event stream | Pipeline progress display | **Powers flow visualization + real-time feedback** |
| Playground components | Fixed layout | **Result Card default view** |

**Not a rewrite -- adding an Intent Layer on top of existing engine:**

```
NEW:     Intent Parser --> Context Builder --> Skill Selector --> Orchestrator
                                                                      |
EXISTING:                                                    LangGraph pipeline
           Scout --> Router --> Draft --> Critic --> Queen         |
                                                              VLM/LLM calls
```

## 11. Updated Growth Flywheel

```
Old flywheel (narrow):
  Good cultural tool --> attract cultural experts --> experts add traditions
  --> better cultural eval --> more experts
  (ceiling: ~10K users max)

New flywheel (broad):
  Easy-to-use quality check ("does this work?")
    --> attracts AI creators (millions)
    --> users give feedback ("this score feels wrong for my use case")
    --> system learns + community contributes Skills
    --> more accurate, more contexts covered
    --> more users trust the system
    --> becomes the standard for "AI output quality"
    --> enterprise adoption (brand safety, cultural compliance at scale)
```

## 12. Execution Priority (Updated)

| Priority | Task | Purpose |
|----------|------|---------|
| **P0** | Intent Parser prototype (natural language --> skill selection) | Core NoCode experience |
| **P0** | Result Card view (score + suggestions + "Show flow" toggle) | Default user-facing UI |
| **P0** | Flow Visualizer (auto-generated from execution, using existing React Flow) | Transparency / trust |
| **P1** | 3 non-cultural Skills (brand consistency, audience fit, trend match) | Prove beyond-culture capability |
| **P1** | Implicit feedback collection (which results user keeps/discards) | Self-evolution data pipeline |
| **P1** | Code export from any flow node | Developer escape hatch |
| **P2** | Skill marketplace UI (browse, add, rate Skills) | Community ecosystem |
| **P2** | User preference model (per-user evaluation adjustments) | Personalization |
| **P2** | Video input support (first multimodal expansion) | Market expansion |
| **P3** | Skill creation wizard (describe in natural language --> auto-generate) | Community contribution |
| **P3** | A/B testing framework for evaluation accuracy | Data-driven improvement |

## 13. Risk Acknowledgment

| Risk | Severity | Mitigation |
|------|----------|------------|
| "NoCode" becomes too vague, loses academic credibility | Medium | L1-L5 remains as validated Skill Pack; papers still valid |
| Self-evolution introduces noise/bias | Medium | Expert-validated Skills have higher trust weight; community voting |
| Scope creep (trying to evaluate everything) | High | Start with image + 3 non-cultural Skills; expand only after validation |
| Existing code becomes legacy before NoCode layer is ready | Low | NoCode layer sits on top, doesn't replace existing engine |
| Natural language intent parsing unreliable | Medium | Fallback to guided prompts / template selection when parser is unsure |
