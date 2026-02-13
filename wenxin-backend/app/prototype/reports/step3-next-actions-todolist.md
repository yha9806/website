# Step 3 Next Actions TODO

**Date**: 2026-02-09  
**Owner**: Yu / Engineering  
**Current Gate**: `NO-GO` (production `/api/v1/prototype/*` not reachable)

## 1) 生产后端发布（先做）
- [ ] 确认 `app/main.py` 已注册 prototype router（`/api/v1/prototype`）。
- [ ] 确认 `app/prototype/api/routes.py`、`schemas.py` 在部署分支中。
- [ ] 触发生产后端部署（Render/GitHub Actions）。
- [ ] 部署后执行在线检查：
  - [ ] `GET /health` == `200`
  - [ ] `POST /api/v1/prototype/runs` != `404`
  - [ ] `GET /api/v1/prototype/runs/{id}` 可返回状态
  - [ ] `GET /api/v1/prototype/runs/{id}/events` SSE 可连通

## 2) 前端联通确认
- [ ] 确认生产前端包含 `/prototype` 页面路由。
- [ ] 确认生产前端 API base 指向正确后端域名。
- [ ] 在生产页面执行 1 次完整 run，检查 stage 流程显示正常。

## 3) 10% 灰度验证
- [ ] 正常样例：结果 `accept`，产物完整。
- [ ] taboo 样例：结果非 `accept`。
- [ ] 至少观察到 1 次 rerun 循环。
- [ ] 至少提交 1 次 HITL action（如 `lock_dimensions`）并生效。

## 4) 质量门
- [ ] 后端测试门：`pytest` + 核心验证脚本通过。
- [ ] 前端测试门：`npm run lint`、`npm run build`、关键 e2e 通过。
- [ ] 指标门：P95 延迟、成本、taboo miss 达标。
- [ ] 报告回填：`step3-online-gray-validation-checklist.md` 更新结果。

## 5) 发布决策
- [ ] 若全部通过：更新 `step3-go-no-go.md` 为 `GO`。
- [ ] 若任一 Hard Gate 触发：立即回滚到 `step3-all-green` 基线并记录原因。

## 6) 交付物（本轮完成标准）
- [ ] 线上可用证据：接口回包 + 页面截图 + run artifacts。
- [ ] 一页汇报材料更新（架构、结果、风险、下一步）。
- [ ] 复盘条目：本次阻塞点与修复动作沉淀到 runbook。

