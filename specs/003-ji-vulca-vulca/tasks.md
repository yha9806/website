# Tasks: VULCA Deep Integration

**Input**: Design documents from `/specs/003-ji-vulca-vulca/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/vulca-api.yaml

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript/React frontend, Python/FastAPI backend, PostgreSQL
2. Load design documents:
   → data-model.md: 5 entities (VULCAScore, VULCADimension, etc.)
   → contracts/vulca-api.yaml: 7 API endpoints
   → research.md: Algorithm research plan, cache strategy
3. Generate tasks by category:
   → Algorithm research (3 days)
   → Database migrations (UUID, VULCA tables)
   → API contract tests (7 endpoints)
   → Backend implementation (models, services, API)
   → Frontend components (47D display, progress bars)
   → WebSocket/streaming (Socket.IO)
   → Cache layer (Redis)
   → Integration tests
4. Apply TDD: Tests before implementation
5. Number tasks T001-T045
6. Mark parallel tasks [P] for different files
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included for immediate execution

## Path Conventions
- **Backend**: `wenxin-backend/`
- **Frontend**: `wenxin-moyun/`
- **Tests**: `wenxin-backend/tests/`, `wenxin-moyun/tests/`

## Phase 3.1: Algorithm Research (3 Days)
- [ ] T001 Day 1: Study EMNLP2025-VULCA papers in I:\website\EMNLP2025-VULCA, extract core algorithm to wenxin-backend/app/vulca/algorithms/emnlp2025.py
- [ ] T002 Day 2: Build 47D semantic correlation matrix in wenxin-backend/app/vulca/algorithms/correlation_matrix.py
- [ ] T003 Day 3: Implement and validate prototype algorithm in wenxin-backend/app/vulca/algorithms/vulca_core.py

## Phase 3.2: Database Migrations
- [ ] T004 Create Alembic migration for UUID columns in wenxin-backend/alembic/versions/001_add_uuid_columns.py
- [ ] T005 Create migration for VULCA tables in wenxin-backend/alembic/versions/002_create_vulca_tables.py
- [ ] T006 Create migration for AlgorithmVersion table in wenxin-backend/alembic/versions/003_algorithm_version.py
- [ ] T007 Create migration for indexes and constraints in wenxin-backend/alembic/versions/004_vulca_indexes.py
- [ ] T008 Run migrations and validate schema: `cd wenxin-backend && alembic upgrade head`

## Phase 3.3: Contract Tests (TDD) ⚠️ MUST FAIL FIRST
- [ ] T009 [P] Contract test GET /v2/models/{uuid}/vulca in wenxin-backend/tests/contract/test_vulca_get.py
- [ ] T010 [P] Contract test POST /v2/models/{uuid}/vulca/generate in wenxin-backend/tests/contract/test_vulca_generate.py
- [ ] T011 [P] Contract test GET /v2/vulca/algorithm-version in wenxin-backend/tests/contract/test_algorithm_version.py
- [ ] T012 [P] Contract test GET /v2/vulca/dimensions in wenxin-backend/tests/contract/test_dimensions.py
- [ ] T013 [P] Contract test POST /v2/vulca/batch in wenxin-backend/tests/contract/test_vulca_batch.py
- [ ] T014 [P] Contract test GET /v2/vulca/leaderboard in wenxin-backend/tests/contract/test_leaderboard.py
- [ ] T015 [P] Contract test POST /v2/vulca/compare in wenxin-backend/tests/contract/test_compare.py

## Phase 3.4: Backend Models & Schemas
- [ ] T016 [P] VULCAScore SQLAlchemy model in wenxin-backend/app/vulca/models/vulca_score.py
- [ ] T017 [P] VULCADimension model in wenxin-backend/app/vulca/models/vulca_dimension.py
- [ ] T018 [P] CulturalPerspective models in wenxin-backend/app/vulca/models/cultural_perspective.py
- [ ] T019 [P] AlgorithmVersion model in wenxin-backend/app/vulca/models/algorithm_version.py
- [ ] T020 [P] Pydantic schemas in wenxin-backend/app/vulca/schemas/vulca_schemas.py
- [ ] T021 Update AIModel with UUID fields in wenxin-backend/app/models/ai_model.py

## Phase 3.5: Backend Services
- [ ] T022 VULCAService core logic in wenxin-backend/app/vulca/services/vulca_service.py
- [ ] T023 Algorithm service for 6D→47D expansion in wenxin-backend/app/vulca/services/algorithm_service.py
- [ ] T024 Tier authorization service in wenxin-backend/app/vulca/services/tier_service.py
- [ ] T025 Cache service with Redis in wenxin-backend/app/vulca/services/cache_service.py

## Phase 3.6: Backend API Endpoints
- [ ] T026 GET /v2/models/{uuid}/vulca endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T027 POST /v2/models/{uuid}/vulca/generate endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T028 GET /v2/vulca/algorithm-version endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T029 GET /v2/vulca/dimensions endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T030 POST /v2/vulca/batch endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T031 GET /v2/vulca/leaderboard endpoint in wenxin-backend/app/vulca/routes.py
- [ ] T032 POST /v2/vulca/compare endpoint in wenxin-backend/app/vulca/routes.py

## Phase 3.7: Batch Processing & WebSocket
- [ ] T033 Celery task for nightly VULCA generation in wenxin-backend/app/tasks/vulca_generation.py
- [ ] T034 Socket.IO server setup in wenxin-backend/app/websocket/socketio_server.py
- [ ] T035 WebSocket room management for enterprise tier in wenxin-backend/app/websocket/rooms.py
- [ ] T036 SSE endpoint for streaming updates in wenxin-backend/app/vulca/streaming.py

## Phase 3.8: Frontend Components
- [ ] T037 [P] VULCADimensionDisplay component in wenxin-moyun/src/components/vulca/VULCADimensionDisplay.tsx
- [ ] T038 [P] VULCAProgressBar component (5 stages) in wenxin-moyun/src/components/vulca/VULCAProgressBar.tsx
- [ ] T039 [P] DimensionCategoryGroup component in wenxin-moyun/src/components/vulca/DimensionCategoryGroup.tsx
- [ ] T040 [P] CulturalPerspectiveSelector in wenxin-moyun/src/components/vulca/CulturalPerspectiveSelector.tsx
- [ ] T041 [P] VULCAComparison component in wenxin-moyun/src/components/vulca/VULCAComparison.tsx

## Phase 3.9: Frontend Integration
- [ ] T042 Update useVULCAData hook for 47D in wenxin-moyun/src/hooks/vulca/useVULCAData.ts
- [ ] T043 Socket.IO client integration in wenxin-moyun/src/services/websocket.ts
- [ ] T044 Update LeaderboardTable for VULCA in wenxin-moyun/src/components/leaderboard/LeaderboardTable.tsx
- [ ] T045 Update ModelDetail page in wenxin-moyun/src/pages/ModelDetail.tsx

## Phase 3.10: Integration Tests
- [ ] T046 [P] Test free tier access (TOP 5 only) in wenxin-backend/tests/integration/test_free_tier.py
- [ ] T047 [P] Test paid tier (full 47D + perspectives) in wenxin-backend/tests/integration/test_paid_tier.py
- [ ] T048 [P] Test enterprise WebSocket updates in wenxin-backend/tests/integration/test_websocket.py
- [ ] T049 [P] Test cache invalidation events in wenxin-backend/tests/integration/test_cache.py
- [ ] T050 [P] Test UUID/Integer dual ID system in wenxin-backend/tests/integration/test_dual_id.py

## Phase 3.11: Frontend E2E Tests
- [ ] T051 [P] E2E test VULCA dimension display in wenxin-moyun/tests/e2e/vulca-display.spec.ts
- [ ] T052 [P] E2E test progress bar stages in wenxin-moyun/tests/e2e/vulca-progress.spec.ts
- [ ] T053 [P] E2E test tier-based visibility in wenxin-moyun/tests/e2e/vulca-tiers.spec.ts
- [ ] T054 [P] E2E test model comparison in wenxin-moyun/tests/e2e/vulca-compare.spec.ts

## Phase 3.12: Performance & Polish
- [ ] T055 [P] Load test VULCA endpoints (<200ms) in wenxin-backend/tests/load/vulca_load_test.py
- [ ] T056 [P] Optimize 47D expansion algorithm in wenxin-backend/app/vulca/algorithms/vulca_core.py
- [ ] T057 [P] Add API documentation in wenxin-backend/docs/vulca-api.md
- [ ] T058 [P] Update frontend documentation in wenxin-moyun/docs/vulca-integration.md
- [ ] T059 Deprecation warnings for 6D endpoints in wenxin-backend/app/api/v1/
- [ ] T060 Final validation with quickstart.md scenarios

## Dependencies
- Algorithm research (T001-T003) blocks all implementation
- Migrations (T004-T008) before models (T016-T021)
- Contract tests (T009-T015) must fail before API implementation (T026-T032)
- Models (T016-T021) before services (T022-T025)
- Services before endpoints (T026-T032)
- Backend complete before frontend integration (T042-T045)
- All implementation before integration tests (T046-T054)

## Parallel Execution Examples

### Batch 1: Contract Tests (After migrations)
```bash
# Launch T009-T015 together (all different files):
Task: "Contract test GET /v2/models/{uuid}/vulca in wenxin-backend/tests/contract/test_vulca_get.py"
Task: "Contract test POST /v2/models/{uuid}/vulca/generate in wenxin-backend/tests/contract/test_vulca_generate.py"
Task: "Contract test GET /v2/vulca/algorithm-version in wenxin-backend/tests/contract/test_algorithm_version.py"
Task: "Contract test GET /v2/vulca/dimensions in wenxin-backend/tests/contract/test_dimensions.py"
Task: "Contract test POST /v2/vulca/batch in wenxin-backend/tests/contract/test_vulca_batch.py"
Task: "Contract test GET /v2/vulca/leaderboard in wenxin-backend/tests/contract/test_leaderboard.py"
Task: "Contract test POST /v2/vulca/compare in wenxin-backend/tests/contract/test_compare.py"
```

### Batch 2: Backend Models
```bash
# Launch T016-T020 together (all different files):
Task: "VULCAScore SQLAlchemy model in wenxin-backend/app/vulca/models/vulca_score.py"
Task: "VULCADimension model in wenxin-backend/app/vulca/models/vulca_dimension.py"
Task: "CulturalPerspective models in wenxin-backend/app/vulca/models/cultural_perspective.py"
Task: "AlgorithmVersion model in wenxin-backend/app/vulca/models/algorithm_version.py"
Task: "Pydantic schemas in wenxin-backend/app/vulca/schemas/vulca_schemas.py"
```

### Batch 3: Frontend Components
```bash
# Launch T037-T041 together (all different files):
Task: "VULCADimensionDisplay component in wenxin-moyun/src/components/vulca/VULCADimensionDisplay.tsx"
Task: "VULCAProgressBar component (5 stages) in wenxin-moyun/src/components/vulca/VULCAProgressBar.tsx"
Task: "DimensionCategoryGroup component in wenxin-moyun/src/components/vulca/DimensionCategoryGroup.tsx"
Task: "CulturalPerspectiveSelector in wenxin-moyun/src/components/vulca/CulturalPerspectiveSelector.tsx"
Task: "VULCAComparison component in wenxin-moyun/src/components/vulca/VULCAComparison.tsx"
```

### Batch 4: Integration Tests
```bash
# Launch T046-T050 together (all different test files):
Task: "Test free tier access (TOP 5 only) in wenxin-backend/tests/integration/test_free_tier.py"
Task: "Test paid tier (full 47D + perspectives) in wenxin-backend/tests/integration/test_paid_tier.py"
Task: "Test enterprise WebSocket updates in wenxin-backend/tests/integration/test_websocket.py"
Task: "Test cache invalidation events in wenxin-backend/tests/integration/test_cache.py"
Task: "Test UUID/Integer dual ID system in wenxin-backend/tests/integration/test_dual_id.py"
```

## Critical Path
1. **Algorithm Research** (T001-T003) - 3 days, blocks everything
2. **Database Migrations** (T004-T008) - Sequential, blocks models
3. **Contract Tests** (T009-T015) - Parallel, must fail first
4. **Backend Core** (T016-T032) - Mixed parallel/sequential
5. **Frontend** (T037-T045) - Mostly parallel after backend
6. **Testing** (T046-T054) - All parallel, validates implementation

## Notes
- Total tasks: 60
- Parallel tasks: 28 marked with [P]
- Critical path duration: ~10-12 days with parallelization
- Algorithm research is the main bottleneck (3 days sequential)
- Heavy parallelization possible in testing phases
- TDD strictly enforced: Contract tests MUST fail before implementation

## Validation Checklist
- [x] All 7 API endpoints have contract tests
- [x] All 5 entities have model tasks
- [x] All tests come before implementation (TDD)
- [x] Parallel tasks use different files
- [x] Each task specifies exact file path
- [x] No [P] tasks modify the same file
- [x] Dependencies clearly documented
- [x] Quickstart scenarios covered in tests