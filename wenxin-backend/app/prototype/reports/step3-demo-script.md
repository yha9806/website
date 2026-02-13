# VULCA Prototype Demo 操作脚本

**适用场景**: 向研究者/客户演示 VULCA prototype pipeline 全栈能力
**准备时间**: ~3 分钟
**演示时间**: ~10 分钟

---

## 准备工作

### 1. 启动后端

```bash
cd /mnt/i/website/wenxin-backend

# Mock 模式（无需 API key，秒级响应）
python3 -m uvicorn app.main:app --reload --port 8001

# 真实图片生成模式（需要 Together.ai key，~2s/image）
TOGETHER_API_KEY=<your-key> python3 -m uvicorn app.main:app --reload --port 8001
```

### 2. 启动前端

```bash
cd /mnt/i/website/wenxin-moyun
npm run dev
# → http://localhost:5173
```

### 3. 验证连通

```bash
curl -s http://localhost:8001/api/v1/prototype/runs \
  -X POST -H "Content-Type: application/json" \
  -d '{"subject":"test","tradition":"default"}' | python3 -m json.tool
```

---

## 演示场景 A: 快速流程 (Mock, ~5秒)

### 步骤

1. 打开浏览器 `http://localhost:5173/#/prototype`
2. 填写表单:
   - **Subject**: `Dong Yuan mountain landscape with hemp-fiber texture strokes`
   - **Tradition**: Chinese Xieyi
   - **Provider**: Mock (instant)
   - **Candidates**: 4
   - **Max Rounds**: 2
   - **HITL**: 不勾选
3. 点击 **Run Pipeline**
4. 观察进度条: Scout → Draft → Critic → Queen → Archive
5. 查看结果:
   - Scout Evidence: 样本匹配数、术语命中、禁忌检查
   - Draft Candidates: 4 个候选图（mock 渐变色块）
   - Critic Scores: L1-L5 五维评分，Best 标记
   - Queen Decision: accept/rerun/stop/downgrade
   - Final Summary: 轮数、耗时、成本

### 讲解要点

> "Pipeline 自动执行了 5 个阶段：Scout 搜集文化证据，Draft 生成候选图，Critic 进行 L1-L5 五层评分，Queen 做出预算感知决策，Archivist 归档审计日志。整个过程通过 SSE 实时推送到前端。"

---

## 演示场景 B: 真实图片生成 (FLUX, ~8秒)

### 前提

- 后端启动时传入 `TOGETHER_API_KEY`

### 步骤

1. Provider 选择 **FLUX ($0.003/img)**
2. Candidates 设为 **2**（控制成本）
3. Subject: `Classical Chinese ink wash painting of misty mountains`
4. 点击 Run Pipeline
5. 等待 ~2-4 秒（每张图 ~1.5s）
6. 观察真实生成的图片出现在 Candidates Gallery

### 讲解要点

> "这里使用 Together.ai 的 FLUX.1-schnell 模型生成真实图片，每张成本 $0.003。系统内置 fallback 机制，如果 FLUX 不可用会自动降级到 mock provider。"

---

## 演示场景 C: HITL 人类在环 (~2分钟交互)

### 步骤

1. 勾选 **Human-in-the-Loop**
2. Subject: `Japanese ukiyo-e style wave painting`
3. Tradition: Default
4. Provider: Mock
5. 点击 Run Pipeline
6. Pipeline 暂停在 Queen Decision，显示 **Waiting for human**
7. 演示 HITL 控制:
   - 点击 **Advanced** 展开高级选项
   - **Lock 维度**: 勾选 L1 Visual + L2 Technical（绿色锁定）
   - **Rerun 维度**: 勾选 L3 Cultural（蓝色重跑）
   - 输入 **Reason**: "Cultural context needs deeper evaluation"
   - 点击 **Rerun (1 dims)**
8. 观察 Pipeline 恢复执行新一轮
9. 再次暂停时点击 **Approve**
10. Pipeline 完成

### 讲解要点

> "HITL 允许领域专家在 Queen 决策点介入：锁定已确认维度防止重算，选择性重跑不满意的维度，或者 force accept 特定候选。每次操作都记录审计日志。"

---

## 演示场景 D: 错误处理

### Provider 未配置

1. 不设 `TOGETHER_API_KEY` 启动后端
2. 选择 FLUX provider
3. 点击 Run → 显示 🔑 Provider 配置错误提示
4. 切换到 Mock → 正常运行

### 限额耗尽

> 每日限额 50 次 run，超出显示 ⏳ 限额提示

### 服务端断连

> SSE 断连时显示 🖥️ "Connection lost" 提示 + Retry 按钮

---

## API 演示 (命令行)

```bash
# 创建 run
TASK_ID=$(curl -s http://localhost:8001/api/v1/prototype/runs \
  -X POST -H "Content-Type: application/json" \
  -d '{"subject":"Ming dynasty bird-and-flower painting","tradition":"chinese_gongbi"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['task_id'])")
echo "Task: $TASK_ID"

# SSE 事件流
curl -N http://localhost:8001/api/v1/prototype/runs/$TASK_ID/events

# 查询状态
curl -s http://localhost:8001/api/v1/prototype/runs/$TASK_ID | python3 -m json.tool

# HITL 动作（如 enable_hitl=true）
curl -X POST http://localhost:8001/api/v1/prototype/runs/$TASK_ID/action \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
```

---

## 常见 Q&A

**Q: 为什么 Critic 分数都很相似？**
A: Mock provider 生成相同的 dummy 图片，Critic 的规则引擎对相同输入产生相似分数。使用真实 provider 时差异更明显。

**Q: Cost 显示 $0.000？**
A: Mock provider 零成本。使用 FLUX 时会显示实际 API 调用费用。

**Q: Queen 为什么总是 accept？**
A: Mock provider 生成的候选在第一轮通常就过了质量门。可以降低 `gate_threshold` 来触发 rerun 行为。

**Q: 图片为什么是渐变色块？**
A: Mock provider 生成占位图。切换到 FLUX provider 可看到真实 AI 生成图。
