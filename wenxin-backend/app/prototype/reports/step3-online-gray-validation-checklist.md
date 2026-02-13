# Step 3 Online Gray Validation Checklist

**Date**: 2026-02-09  
**Scope**: Validate online readiness for prototype pipeline endpoints and `/prototype` UX path.

## A. Preflight
- [ ] Backend has prototype routes registered (`/api/v1/prototype/*`).
- [ ] Frontend route `/prototype` included in production build.
- [ ] Secrets configured:
  - [ ] `TOGETHER_API_KEY` (if real provider used)
  - [ ] any required CORS/API base settings
- [ ] Rollback version/tag prepared (`step3-all-green`).

## B. Online Smoke (Readiness)
- [ ] Frontend root responds (`200`).
- [ ] Backend `/health` responds (`200`).
- [ ] Prototype create-run endpoint reachable (`POST /api/v1/prototype/runs` returns `200/4xx-valid` not network failure).
- [ ] Prototype status endpoint reachable (`GET /api/v1/prototype/runs/{id}`).
- [ ] SSE endpoint reachable (`GET /api/v1/prototype/runs/{id}/events`).

## C. Functional Gray Run (10%)
- [ ] Normal case: final decision `accept`, artifacts complete.
- [ ] Taboo case: final decision not `accept`.
- [ ] At least one rerun path observed.
- [ ] One HITL action accepted and reflected in state.

## D. Quality Gates
- [ ] No new backend test failures.
- [ ] No new frontend lint/build errors.
- [ ] P95 latency within release target.
- [ ] Cost within release target.
- [ ] No taboo miss.

## E. Rollback Rules
- [ ] Any hard gate trigger => rollback immediately.
- [ ] Rollback tested from current deployment pipeline.
- [ ] Post-rollback health and key path re-verified.

## F. Execution Log (Fill During Run)
- Timestamp:
- Environment:
- Commands executed:
- Results summary:
- Residual risk:

---

## G. Run #1 Results (2026-02-09)

### Automated Checks Executed
- Production frontend: `GET https://vulcaart.art` -> `200`
- Production backend health: `GET https://vulca-api.onrender.com/health` -> `200`
- Production prototype create-run:
  - `POST https://vulca-api.onrender.com/api/v1/prototype/runs` -> `404`
  - Body: `{"detail":"Not Found"}`
- Local control check (same codebase):
  - `POST http://127.0.0.1:8001/api/v1/prototype/runs` -> `200`
  - Confirms route exists in current backend code.

### Interpretation
- Frontend and legacy backend health are online.
- **Prototype API is not deployed on production backend yet** (deployment gap, not algorithm failure).
- Current online gray status: **NO-GO** until backend release includes `/api/v1/prototype/*` routes.

### Immediate Actions Required
1. Deploy backend version containing `app/prototype/api/routes.py` registration in `app/main.py`.
2. Re-run section B and C checks against production.
3. Only after `POST /api/v1/prototype/runs` returns `200`, proceed to 10% gray functional validation.
