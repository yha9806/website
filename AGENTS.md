# Repository Guidelines

## Project Structure & Module Organization
This repository has two primary applications. `wenxin-moyun/` is the React + TypeScript frontend (Vite), with app code in `src/`, static files in `public/`, and automated tests under `tests/` (`e2e/`, `visual/`, `performance/`). `wenxin-backend/` is the FastAPI backend, with API/business logic in `app/` (notably `api/`, `core/`, `services/`, `vulca/`, `exhibition/`) and backend tests in `tests/`. Root-level `scripts/`, `specs/`, and `README.md` hold shared tooling and documentation. `EMNLP2025-VULCA/` is a separate Git repository and should be changed only when intended.

## Build, Test, and Development Commands
Use `./start.sh` from the repo root for a quick local full-stack startup (DB init + backend `:8001` + frontend `:5173`).

Frontend (`wenxin-moyun/`):
- `npm install --legacy-peer-deps` installs dependencies.
- `npm run dev` starts Vite dev server.
- `npm run build` runs TypeScript build checks and production build.
- `npm run lint` runs ESLint.
- `npm run test:e2e` runs Playwright tests (`test:e2e:ui`, `test:e2e:report` for debugging/reporting).

Backend (`wenxin-backend/`):
- `pip install -r requirements.txt` installs Python dependencies.
- `python -m uvicorn app.main:app --reload --port 8001` runs API locally.
- `pytest` runs tests; `pytest --cov=app tests/` adds coverage.

## Coding Style & Naming Conventions
Frontend follows TypeScript strict mode and ESLint (`wenxin-moyun/eslint.config.js`). Prefer `PascalCase` for React page/component files (for example `HomePage.tsx`), `camelCase` for hooks/utilities (for example `useModels.ts`), and descriptive service/store names (`models.service.ts`, `uiStore.ts`). Backend follows PEP 8 style (4-space indentation, `snake_case` functions/modules, `PascalCase` classes). Keep API routers thin and move reusable logic into `app/services/`.

## Testing Guidelines
Frontend tests are Playwright-based and should live in `wenxin-moyun/tests/e2e/specs` with `*.spec.ts` naming. Backend tests use `pytest` with `test_*.py` naming in `wenxin-backend/tests`. Before opening a PR, run lint/build and relevant E2E specs for frontend changes, plus `pytest` for backend changes.

## Mandatory Plan-Completion Quality Gate
After finishing any plan milestone (for example D1/D2/.../Dn), run a strict quality gate before marking it complete.

Trigger:
- Any milestone marked “done”.
- Any code/doc/config change that affects behavior.

Required checks (run what matches changed scope):
- Frontend (`wenxin-moyun/`): `npm run lint`, `npm run build`, `npm run test:e2e` (or targeted spec + full suite before handoff).
- Backend (`wenxin-backend/`): `pytest`, `pytest --cov=app tests/`.
- Full-stack touchpoints: boot both services and verify core flow works end-to-end.

Pass criteria:
- No blocking test failures.
- No new lint/type errors.
- Coverage does not regress for touched backend modules.
- Critical user path smoke test passes.

Evidence (must be logged in milestone note/PR):
- Exact commands executed.
- Pass/fail summary with key numbers (coverage, failed cases, reruns).
- Any residual risk and follow-up action.

Enforcement:
- If gate fails, milestone stays open.
- Fixes must be followed by a full re-run of the affected checks.

## Commit & Pull Request Guidelines
Use Conventional Commit prefixes consistent with history: `feat:`, `fix:`, `docs:`. Keep commits scoped to one area (frontend, backend, or infra). PRs should include: purpose and scope, test evidence (commands run), screenshots for UI changes, and linked issue/task when available. Do not commit secrets (`.env*`, keys) or large generated artifacts unless explicitly required.
