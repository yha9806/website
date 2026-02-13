# VULCA Prototype v2 — Architecture Flowchart & Technical Specification

**Date**: 2026-02-12
**Version**: v2.6 (Three-tier Architecture Upgrade)
**Status**: Layer 1a/1b/1c + Layer 2 COMPLETE | Layer 3 DEFERRED

---

## 1. System Overview

```
                        ┌─────────────────────────────────────┐
                        │         PipelineInput                │
                        │  subject + cultural_tradition        │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │             Phase 0: INIT                │
                    │  TrajectoryRecorder + RunState 初始化     │
                    └──────────────────┬──────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │                   Phase 1: SCOUT                        │
          │                                                         │
          │  ScoutService.gather_evidence()                         │
          │    ├─ sample_matches (FAISS MiniLM 语义搜索)            │
          │    ├─ terminology_hits (术语匹配)                       │
          │    └─ taboo_violations (禁忌检查)                       │
          │                                                         │
          │  ★ Layer 1a: scout_svc.build_evidence_pack()            │
          │    ├─ TerminologyAnchor (术语 + 定义 + 用法提示)        │
          │    ├─ CompositionReference (构图 + 空间策略)            │
          │    ├─ StyleConstraint (风格属性 + 值)                   │
          │    ├─ TabooConstraint (禁忌 + 严重性)                   │
          │    └─ coverage: float [0,1]                             │
          │                                                         │
          │  evidence_coverage = 0.5×sim + 0.4×conf + 0.1×any - p  │
          └────────────────────────────┬────────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │       Phase 2: CULTURAL ROUTING          │
                    │                                          │
                    │  CulturalPipelineRouter.route(tradition)  │
                    │    → PipelineRoute(variant, weights)      │
                    │                                          │
                    │  ┌─ "default"          → 全 5 层均评     │
                    │  ├─ "chinese_xieyi"    → L5=0.30 原子式  │
                    │  └─ "western_academic" → 3 步进阶        │
                    │                                          │
                    │  ★ Layer 2: trajectory_recorder.start()   │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
                    ╔══════════════════════════════════════════╗
                    ║        MAIN LOOP (max 5 rounds)          ║
                    ╚══════════════════╤══════════════════════╝
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │                     DRAFT 阶段                          │
          │                                                         │
          │  DraftAgent.run(input, evidence_pack=pack)              │
          │    ├─ 有 EvidencePack → _build_prompt_from_pack()       │
          │    │   ├─ anchors → usage_hint 拼接                     │
          │    │   ├─ compositions → example_prompt_fragment         │
          │    │   ├─ styles → attribute: value                     │
          │    │   └─ taboos → negative prompt                      │
          │    └─ 无 EvidencePack → _build_prompt() (旧路径)        │
          │                                                         │
          │  生成 n_candidates (default: 4)                         │
          │  ★ Layer 2: trajectory_recorder.record_draft()          │
          └────────────────────────────┬────────────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │                    CRITIC 阶段                          │
          │                                                         │
          │  CriticLLM.run() 或 CriticAgent.run()                  │
          │    ├─ 对每个候选评分 L1-L5 (5 维度)                     │
          │    │   L1: visual_perception     (视觉感知)             │
          │    │   L2: technical_analysis    (技术分析)             │
          │    │   L3: cultural_context      (文化语境)             │
          │    │   L4: critical_interpretation (批评阐释)           │
          │    │   L5: philosophical_aesthetic (哲学美学)           │
          │    │                                                     │
          │    ├─ 渐进深化: _escalate_serial() (L1→L5 顺序)        │
          │    ├─ 跨层信号: _detect_cross_layer_signals()           │
          │    │   ├─ REINTERPRET (L5↔L1/L2 偏差>0.3)              │
          │    │   ├─ CONFLICT    (L3<0.4 但 L5>0.8)               │
          │    │   ├─ EVIDENCE_GAP(|L4-L1|>0.25)                   │
          │    │   └─ CONFIRMATION(L5>0.7 且 L3>0.7)               │
          │    │                                                     │
          │    ├─ 动态权重: compute_dynamic_weights()                │
          │    │                                                     │
          │    ├─ ★ Layer 1b: _generate_fix_it_plan()               │
          │    │   └─ 低分维度(<0.6) → FixItem[]                    │
          │    │       ├─ target_layer + issue                       │
          │    │       ├─ prompt_delta (提示增量)                    │
          │    │       ├─ mask_region_hint (掩码区域)                │
          │    │       └─ strategy: targeted_inpaint / full_regen    │
          │    │                                                     │
          │    └─ ★ Layer 1c: _check_evidence_gaps()                │
          │        └─ coverage<0.7 + 低分 → NeedMoreEvidence         │
          │            ├─ gaps[] + suggested_queries[]                │
          │            └─ urgency: high / medium / low               │
          │                                                         │
          │  ★ Layer 2: trajectory_recorder.record_critic()         │
          └────────────────────────────┬────────────────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │  Layer 1c: 补充检索?       │
                          │  urgency ∈ {high, medium}  │
                          │  AND round_num ≤ 2         │
                          └──────┬──────────┬─────────┘
                            YES  │          │  NO
                    ┌────────────▼──┐       │
                    │ SUPPLEMENTARY  │       │
                    │                │       │
                    │ scout_svc      │       │
                    │ .gather_       │       │
                    │  supplementary │       │
                    │ ()             │       │
                    │                │       │
                    │ FAISS 搜索     │       │
                    │ → 新增 anchor   │       │
                    │ → 更新 pack     │       │
                    │ → 更新 coverage │       │
                    └────────┬──────┘       │
                             └──────┬───────┘
                                    │
          ┌─────────────────────────▼──────────────────────────────┐
          │                    QUEEN 阶段                           │
          │                                                         │
          │  QueenAgent.decide(critique, plan_state)                │
          │                                                         │
          │  8 优先级决策树:                                          │
          │  ┌─────────────────────────────────────────────────┐    │
          │  │ P1: score ≥ 0.90 + gate  → ACCEPT (早停)       │    │
          │  │ P2: rounds ≥ 5           → STOP   (超轮)       │    │
          │  │ P3: cost ≥ $0.50         → STOP   (超预)       │    │
          │  │ P4: cost ≥ $0.40         → DOWNGRADE (降级)     │    │
          │  │ P5: score ≥ 0.70 + gate  → ACCEPT (阈值通过)   │    │
          │  │ P5b: cross_layer_signals → RERUN  (信号驱动)    │    │
          │  │ P6: rerun_hint 存在      → RERUN  (提示驱动)   │    │
          │  │ P7: delta < 0.05         → STOP   (改进不足)   │    │
          │  │ P8: 默认                 → RERUN               │    │
          │  └─────────────────────────────────────────────────┘    │
          │                                                         │
          │  ★ Layer 2: trajectory_recorder.record_decision()       │
          └────────────────────────────┬────────────────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │  HITL (可选人工干预)       │
                          │  approve / reject /        │
                          │  rerun / lock_dimensions / │
                          │  force_accept              │
                          └────────────┬──────────────┘
                                       │
              ┌────────────────────────▼────────────────────────┐
              │                   DECISION ROUTER               │
              └────┬──────────┬──────────┬──────────┬──────────┘
                   │          │          │          │
            ┌──────▼──┐ ┌────▼────┐ ┌───▼───┐ ┌───▼──────┐
            │ ACCEPT   │ │  STOP   │ │ RERUN │ │RERUN_    │
            │          │ │         │ │(全局)  │ │LOCAL     │
            └──────┬──┘ └────┬────┘ └───┬───┘ └───┬──────┘
                   │         │          │          │
                   ▼         ▼          │          ▼
              EXIT LOOP  EXIT LOOP      │   ┌─────────────────┐
                                        │   │ 文化变体检查      │
                                        │   │ allow_local_rerun │
                                        │   │ == True?          │
                                        │   └──┬──────────┬────┘
                                        │  YES │          │ NO
                                        │      │     ┌────▼────┐
                                        │      │     │转为 RERUN│
                                        │      │     └────┬────┘
                                        │      │          │
                                        │      ▼          │
                                        │  ┌──────────────────┐
                                        │  │  LOCAL RERUN      │
                                        │  │                   │
                                        │  │  有 FixItPlan?    │
                                        │  │  ┌──YES──┐ ┌NO──┐│
                                        │  │  │       │ │    ││
                                        │  │  ▼       │ ▼    ││
                                        │  │rerun_    │refine││
                                        │  │with_fix()│_cand-││
                                        │  │          │idate ││
                                        │  │prompt_   │()    ││
                                        │  │delta +   │      ││
                                        │  │mask_hint │mask  ││
                                        │  │          │gen + ││
                                        │  │          │inpnt ││
                                        │  └───┬──────┴──┬───┘│
                                        │      └────┬────┘    │
                                        │           │         │
                                        │  改进候选   │         │
                                        │  → 回到     │         │
                                        │    CRITIC   │         │
                                        │           │         │
                                        ◄───────────┘         │
                                        ◄─────────────────────┘
                                        │
                                   回到 DRAFT ──────────▶ LOOP TOP
```

---

## 2. Three-tier Architecture Detail

### Layer 1a: Scout → Draft EvidencePack

```
                    ScoutService
                        │
                gather_evidence()
                        │
              ┌─────────▼──────────┐
              │   ScoutEvidence     │
              │ ├ sample_matches    │
              │ ├ terminology_hits  │
              │ └ taboo_violations  │
              └─────────┬──────────┘
                        │
              build_evidence_pack()
                        │
              ┌─────────▼──────────────────────────────────┐
              │              EvidencePack                    │
              │                                             │
              │  anchors: TerminologyAnchor[]               │
              │    ├─ term: "披麻皴"                         │
              │    ├─ definition: "Hemp-fiber stroke..."     │
              │    ├─ usage_hint: "use for texture desc."   │
              │    ├─ l_levels: ["L2", "L3"]                │
              │    └─ confidence: 1.0                        │
              │                                             │
              │  compositions: CompositionReference[]        │
              │    ├─ spatial_strategy: "asymmetric_balance" │
              │    └─ example_prompt_fragment: "sparse..."   │
              │                                             │
              │  styles: StyleConstraint[]                   │
              │    ├─ attribute: "brush_texture"             │
              │    └─ value: "dry brush with visible..."     │
              │                                             │
              │  taboos: TabooConstraint[]                   │
              │    ├─ description: "avoid photorealistic..." │
              │    └─ severity: "medium"                     │
              │                                             │
              │  coverage: 0.72                              │
              └──────────┬─────────────────────────────────┘
                         │
                    to_prompt_context()
                         │
              ┌──────────▼──────────────────────────────────┐
              │  [Terminology]                               │
              │  披麻皴 — Hemp-fiber stroke... → use for ... │
              │                                              │
              │  [Composition]                               │
              │  sparse composition with empty space          │
              │                                              │
              │  [Style]                                     │
              │  brush_texture: dry brush with visible...     │
              │                                              │
              │  [Avoid]                                     │
              │  avoid photorealistic rendering               │
              └──────────┬──────────────────────────────────┘
                         │
                    DraftAgent._build_prompt_from_pack()
                         │
                         ▼
              Enhanced Prompt + Negative Prompt
```

### Layer 1b: Critic → Draft FixItPlan

```
              CriticLLM._generate_fix_it_plan()
                         │
              scored_candidates[0].dimension_scores
                         │
              ┌──────────▼──────────────────────────┐
              │  score < 0.6 的维度?                  │
              │                                      │
              │  L2 (technical): 0.4 → FixItem       │
              │    ├─ issue: "poor technique"         │
              │    ├─ prompt_delta: "refine brush..." │
              │    ├─ mask_region_hint: "foreground"  │
              │    └─ priority: 1                     │
              │                                      │
              │  L3 (cultural): 0.3 → FixItem         │
              │    ├─ issue: "insufficient cultural"  │
              │    ├─ prompt_delta: "add symbolism..." │
              │    ├─ mask_region_hint: "centre"      │
              │    └─ priority: 2                     │
              └──────────┬──────────────────────────┘
                         │
              FixItPlan:
              ├─ strategy: ≥3 low → "full_regenerate"
              │            else   → "targeted_inpaint"
              ├─ to_prompt_delta() → 合并所有修复项
              └─ get_mask_hint()   → 最高优先级区域
                         │
                         │  Queen decides "rerun_local"
                         │
              ┌──────────▼──────────────────────────┐
              │  DraftAgent.rerun_with_fix()         │
              │                                      │
              │  original_prompt                     │
              │  + fix_plan.to_prompt_delta()         │
              │  + fix_plan.get_negative_additions()  │
              │  + evidence_pack context              │
              │                                      │
              │  Inpaint provider selection:          │
              │  ├─ mock (无 GPU)                     │
              │  ├─ diffusers (SD 1.5)               │
              │  └─ controlnet (canny/depth)          │
              │                                      │
              │  Mask region: fix_plan.get_mask_hint()│
              └──────────┬──────────────────────────┘
                         │
                         ▼
              改进后的单候选 → 返回 CRITIC 重新评分
```

### Layer 1c: Critic → Scout NeedMoreEvidence

```
              CriticLLM._check_evidence_gaps()
                         │
              ┌──────────▼──────────────────────────┐
              │  检查条件:                            │
              │  1. evidence_coverage < 0.7           │
              │  2. 存在低分维度 (< 0.5)              │
              │                                      │
              │  生成:                                │
              │  NeedMoreEvidence:                    │
              │  ├─ gaps: ["L3: score 0.3 — 不足"]   │
              │  ├─ suggested_queries:                │
              │  │   ["chinese_xieyi symbolism"]      │
              │  ├─ target_layers: ["L3"]             │
              │  ├─ urgency: high/medium/low          │
              │  │   ├─ ≥3 gaps or cov<0.3 → high    │
              │  │   ├─ ≥2 gaps or cov<0.5 → medium  │
              │  │   └─ else → low                    │
              │  └─ evidence_coverage_before: 0.45    │
              └──────────┬──────────────────────────┘
                         │
              Orchestrator 检查:
              urgency ∈ {high, medium}
              AND round_num ≤ 2
                         │
              ┌──────────▼──────────────────────────┐
              │  ScoutService.gather_supplementary() │
              │                                      │
              │  1. 遍历 suggested_queries            │
              │  2. FAISS semantic search             │
              │  3. 去重 (vs existing anchors)        │
              │  4. 新增 TerminologyAnchor            │
              │  5. 重算 coverage                     │
              │  6. 返回更新的 EvidencePack            │
              └──────────┬──────────────────────────┘
                         │
                         ▼
              evidence_pack 更新 → 后续 Draft 使用更丰富的证据
```

### Layer 2: Trajectory System

```
              Pipeline 开始
                  │
                  ▼
     trajectory_recorder.start(subject, tradition, evidence_pack_dict)
                  │
         ┌────── │ ──────────── LOOP ─────────────────┐
         │       │                                     │
         │       ▼                                     │
         │  .record_draft(DraftPlan, round_num)        │
         │    ├─ PromptTrace (raw + enhanced + hash)   │
         │    ├─ provider, generation_params            │
         │    ├─ latency_ms, n_candidates               │
         │    └─ success                                │
         │       │                                     │
         │       ▼                                     │
         │  .record_critic(CriticFindings, round_num)  │
         │    ├─ layer_scores: {L1→0.7, L2→0.5, ...}  │
         │    ├─ weighted_score: 0.54                    │
         │    ├─ fix_it_plan_dict (Layer 1b)            │
         │    └─ need_more_evidence_dict (Layer 1c)     │
         │       │                                     │
         │       ▼                                     │
         │  .record_decision(DecisionLog, round_num)   │
         │    ├─ action: accept/rerun/stop/...          │
         │    ├─ reason: "above threshold"              │
         │    ├─ round_num                              │
         │    └─ threshold                              │
         │       │                                     │
         └───────┘ (next round if RERUN)               │
                                                       │
              Pipeline 结束                             │
                  │                                     │
                  ▼                                     │
     trajectory_recorder.finish(                        │
         final_score, final_action,                     │
         total_latency_ms, total_cost                   │
     )                                                  │
                  │                                     │
                  ▼                                     │
     /data/trajectories/{trajectory_id}.json            │
                  │                                     │
     ┌────────────▼──────────────────────────┐         │
     │  TrajectoryRecord:                     │         │
     │  ├─ trajectory_id: UUID                │         │
     │  ├─ subject, tradition                  │         │
     │  ├─ evidence_pack_dict: {...}           │         │
     │  ├─ rounds: [                           │         │
     │  │    RoundRecord {                     │         │
     │  │      round_num, draft_plan,          │         │
     │  │      critic_findings, decision       │         │
     │  │    }, ...                             │         │
     │  │  ]                                   │         │
     │  ├─ final_score, final_action           │         │
     │  ├─ total_latency_ms, total_cost        │         │
     │  └─ timestamp                           │         │
     └────────────┬──────────────────────────┘         │
                  │                                     │
                  ▼                                     │
     FAISS Trajectory Index (MiniLM 384-dim)            │
     └─ build_trajectory_index() → search_trajectories()│
        └─ 未来 Layer 3 (Queen LLM + RAG) 消费          │
```

---

## 3. Cultural Routing Variants

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                   Cultural Pipeline Router                       │
  │                                                                  │
  │  tradition → route(tradition) → PipelineRoute(variant, weights)  │
  └───────┬───────────────────┬────────────────────┬─────────────────┘
          │                   │                    │
          ▼                   ▼                    ▼

  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────┐
  │   DEFAULT      │  │ CHINESE XIEYI  │  │ WESTERN ACADEMIC    │
  │                │  │  (一气呵成)      │  │  (三步进阶)         │
  │ L1-L5 均评     │  │                 │  │                     │
  │ 标准权重:      │  │ L5 权重突出:     │  │ 形式分析优先:       │
  │ 0.20 each     │  │ L5=0.30         │  │ L1=0.25, L2=0.25   │
  │               │  │ L3=0.25         │  │ L3=0.20, L4=0.20   │
  │ local_rerun:  │  │ L1,L2,L4=0.15  │  │ L5=0.10            │
  │ ✅ allowed    │  │                 │  │                     │
  │               │  │ local_rerun:    │  │ local_rerun:        │
  │ 适用:         │  │ ❌ forbidden    │  │ ✅ allowed          │
  │ 大部分传统    │  │                 │  │                     │
  │               │  │ 适用:           │  │ 适用:               │
  │               │  │ chinese_xieyi   │  │ western_academic    │
  └───────────────┘  └────────────────┘  └─────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  9 传统权重表 (cultural_weights.py)                          │
  │                                                              │
  │  传统              L1    L2    L3    L4    L5   特征维度     │
  │  ─────────────── ───── ───── ───── ───── ───── ──────────── │
  │  chinese_xieyi   0.15  0.15  0.25  0.15  0.30  L5 哲学美学  │
  │  chinese_gongbi  0.15  0.30  0.25  0.15  0.15  L2 技术工笔  │
  │  japanese_ukiyo  0.20  0.25  0.20  0.15  0.20  L2 版画技术  │
  │  western_acad.   0.25  0.25  0.20  0.20  0.10  L1+L2 形式  │
  │  islamic_geom.   0.25  0.25  0.17  0.17  0.16  L1+L2 几何  │
  │  african_sculp.  0.15  0.15  0.30  0.25  0.15  L3 文化语境  │
  │  indian_miniature 0.20 0.25  0.25  0.15  0.15  L2+L3 细密  │
  │  korean_celadon  0.20  0.25  0.20  0.15  0.20  L2 釉色技术  │
  │  default         0.20  0.20  0.20  0.20  0.20  均衡         │
  └──────────────────────────────────────────────────────────────┘
```

---

## 4. Model Deployment Map

```
  ┌───────────────────────────────────────────────────────────────────┐
  │                        MODEL ECOSYSTEM                            │
  │                                                                   │
  │  ┌─── API Models ──────────────────────────────────────────┐      │
  │  │                                                          │      │
  │  │  DeepSeek V3.2     ← CriticLLM / Agent 推理             │      │
  │  │  Gemini 2.5 Flash  ← CriticLLM 备选                     │      │
  │  │  GPT-4o-mini       ← CriticLLM 备选 (KEY EXPIRED)       │      │
  │  │  FLUX.1-schnell    ← Draft 图像生成 (Together.ai)        │      │
  │  └──────────────────────────────────────────────────────────┘      │
  │                                                                   │
  │  ┌─── Local CPU Models ────────────────────────────────────┐      │
  │  │                                                          │      │
  │  │  all-MiniLM-L6-v2  ← FAISS 语义搜索 (384-dim)          │      │
  │  │  CLIP ViT-B/32     ← 视觉语义搜索 (512-dim)             │      │
  │  └──────────────────────────────────────────────────────────┘      │
  │                                                                   │
  │  ┌─── Local GPU Models (RTX 2070 Max-Q 8GB) ──────────────┐      │
  │  │                                                          │      │
  │  │  SD 1.5             ← Draft 图像生成 + Inpainting        │      │
  │  │  ControlNet         ← 结构化内绘 (canny / depth)         │      │
  │  │  IP-Adapter         ← 风格迁移                           │      │
  │  │  GalleryGPT 7B 4b  ← VLM 艺术品分析 (4327MB)            │      │
  │  │  KOALA 700M         ← 快速图像生成 (SDXL, 1024x1024)    │      │
  │  └──────────────────────────────────────────────────────────┘      │
  │                                                                   │
  │  Fallback Chain (Draft):                                          │
  │  together_flux → koala → diffusers(SD1.5) → mock                 │
  │                                                                   │
  │  Inpaint Provider Selection (by L-layer):                         │
  │  L1/L4 → ControlNet canny (边缘结构)                              │
  │  L2/L3 → ControlNet depth (深度结构)                              │
  │  L5    → 自由重绘 (无结构约束)                                     │
  └───────────────────────────────────────────────────────────────────┘
```

---

## 5. Cross-Layer Signal System

```
  CriticLLM._detect_cross_layer_signals(dim_scores)

  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  L1 ──── 0.7 ────────────────────────── L5 ──── 0.4        │
  │  visual                                  philosophical      │
  │                                                              │
  │  |L5 - L1| = 0.3 > threshold            type: REINTERPRET  │
  │  → "哲学与视觉感知矛盾，重新评估 L1"                         │
  │                                                              │
  ├──────────────────────────────────────────────────────────────┤
  │                                                              │
  │  L3 ──── 0.3 (低)                       L5 ──── 0.9 (高)   │
  │  cultural                                philosophical      │
  │                                                              │
  │  L3 < 0.4 AND L5 > 0.8                  type: CONFLICT     │
  │  → "文化基础薄弱但哲学评价极高 → 文化遗漏"                   │
  │                                                              │
  ├──────────────────────────────────────────────────────────────┤
  │                                                              │
  │  L4 ──── 0.8                             L1 ──── 0.5        │
  │  critical                                visual             │
  │                                                              │
  │  |L4 - L1| = 0.3 > 0.25                 type: EVIDENCE_GAP │
  │  → "解释与视觉分歧 → 视觉证据不足"                           │
  │                                                              │
  ├──────────────────────────────────────────────────────────────┤
  │                                                              │
  │  L5 ──── 0.8                             L3 ──── 0.75       │
  │  philosophical                           cultural           │
  │                                                              │
  │  L5 > 0.7 AND L3 > 0.7                  type: CONFIRMATION │
  │  → "哲学确认文化基础扎实"                                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  信号消费:
  cross_layer_signals → plan_state → Queen._decide_action()
    ├─ 提取 REINTERPRET/CONFLICT/EVIDENCE_GAP (strength ≥ 0.3)
    ├─ 映射 target_layer → dimension_id
    │   L1 → visual_perception
    │   L2 → technical_analysis
    │   L3 → cultural_context
    │   L4 → critical_interpretation
    │   L5 → philosophical_aesthetic
    └─ 生成 RERUN(rerun_dimensions=[target_dims])
```

---

## 6. File Map

### Directory Structure

```
wenxin-backend/app/prototype/
├── __init__.py
├── orchestrator/
│   └── orchestrator.py          # 主流水线编排器 (PipelineOrchestrator)
│
├── agents/                       # 5 Agent 角色
│   ├── queen_agent.py           # Queen: 8 优先级决策引擎
│   ├── critic_llm.py            # CriticLLM: 混合规则+LLM 评论家
│   ├── critic_agent.py          # CriticAgent: 纯规则评论家
│   ├── draft_agent.py           # DraftAgent: 图像生成 + 重运行
│   ├── archivist_agent.py       # ArchivistAgent: 证据链归档
│   ├── fix_it_plan.py           # ★ Layer 1b: FixItPlan 协议
│   ├── need_more_evidence.py    # ★ Layer 1c: NeedMoreEvidence 协议
│   ├── draft_config.py          # Draft 配置
│   ├── draft_types.py           # Draft 数据类型
│   ├── critic_types.py          # Critic 数据类型
│   ├── layer_state.py           # L1-L5 层状态 + 跨层信号
│   ├── dynamic_weights.py       # 动态权重调制
│   ├── model_router.py          # 模型路由
│   ├── inpaint_provider.py      # Inpainting 提供商
│   ├── controlnet_provider.py   # ControlNet canny/depth
│   ├── ip_adapter_provider.py   # IP-Adapter 风格迁移
│   ├── gallery_gpt_provider.py  # GalleryGPT VLM
│   └── koala_provider.py        # KOALA 700M 图像生成
│
├── tools/                        # 外部工具
│   ├── scout_service.py         # ScoutService + ★ Layer 1a: build_evidence_pack()
│   ├── evidence_pack.py         # ★ Layer 1a: EvidencePack 数据协议
│   ├── faiss_index_service.py   # FAISS 索引 (MiniLM + CLIP + ★ Trajectory)
│   ├── terminology_loader.py    # 术语字典加载
│   ├── sample_matcher.py        # 样本匹配
│   └── validate_*.py            # 36 个验证脚本
│
├── trajectory/                   # ★ Layer 2: 轨迹系统
│   ├── __init__.py
│   ├── trajectory_types.py      # 轨迹数据类型
│   └── trajectory_recorder.py   # 轨迹记录器
│
├── pipeline/                     # 流水线配置
│   ├── pipeline_types.py        # PipelineInput/Output
│   ├── pipeline_router.py       # 文化管道路由器
│   ├── cultural_weights.py      # 9 传统权重表
│   └── fallback_chain.py        # Draft fallback chain
│
├── data/
│   ├── samples/                 # VULCA-Bench 样本子集
│   ├── terminology/             # 文化术语字典
│   ├── trajectories/            # ★ Layer 2: 轨迹 JSON 存储
│   └── generated/               # 生成结果
│
└── reports/                      # 执行报告
    ├── v2-model-deployment-report.md
    ├── v2-architecture-flowchart.md  # ← 本文档
    └── d1-*.md ... d14-*.md     # 每日报告
```

### Key File Relationships

```
                    evidence_pack.py ◄─── scout_service.py
                         │                     │
                         │               (build_evidence_pack)
                         ▼                     │
                    draft_agent.py ◄────────────┘
                         │          (evidence_pack param)
                         │
                    fix_it_plan.py ◄─── critic_llm.py
                         │                  │
                         │           (_generate_fix_it_plan)
                         ▼                  │
                    draft_agent.py ◄────────┘
                         │          (rerun_with_fix)
                         │
              need_more_evidence.py ◄─── critic_llm.py
                         │                  │
                         │           (_check_evidence_gaps)
                         ▼                  │
                    scout_service.py ◄──────┘
                         │          (gather_supplementary)
                         │
              trajectory_recorder.py ◄─── orchestrator.py
              trajectory_types.py          (record at each stage)
                         │
                         ▼
              faiss_index_service.py
                         │
                (build_trajectory_index)
                         │
                         ▼
              Layer 3: Queen LLM + RAG (DEFERRED)
```

---

## 7. Verification Summary

| Test Suite | Result | Script |
|-----------|--------|--------|
| Layer 1-2 Architecture | **50/50 PASS** | `validate_trajectory.py` |
| E2E Regression (20x3) | **60/60 PASS** | `validate_e2e_regression.py` |
| FAISS + MiniLM | 29/29 PASS | `validate_scout_faiss.py` |
| CLIP Visual | 17/17 PASS | `validate_clip_visual.py` |
| Draft + Refine | 30/30 PASS | `validate_draft_refine.py` |
| CriticLLM Agent | 28/28 PASS | `validate_critic_llm.py` |
| Cultural Router | 96/96 PASS | `validate_cultural_router.py` |
| SD 1.5 GPU | 30/30 PASS | (GPU mode) |
| ControlNet GPU | 26/26 PASS | `validate_controlnet.py` |
| IP-Adapter GPU | 13/13 PASS | `validate_ip_adapter.py` |
| GalleryGPT GPU | 34/35 PASS | `validate_gallery_gpt.py` |
| KOALA GPU | 16/16 PASS | `validate_koala.py` |
| **Total** | **~430 checks** | 36 scripts |
