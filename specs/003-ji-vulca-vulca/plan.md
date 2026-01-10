# Implementation Plan: VULCA Deep Integration

**Branch**: `003-ji-vulca-vulca` | **Date**: 2025-09-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ji-vulca-vulca/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement comprehensive VULCA 47-dimension evaluation system to replace the current 6D evaluation, including UUID migration, snake_case standardization, tiered access model, and intelligent algorithmic expansion from 6D to 47D based on EMNLP2025-VULCA research.

## Technical Context
**Language/Version**: Frontend: TypeScript 5.8/React 19.1, Backend: Python 3.11/FastAPI 0.116  
**Primary Dependencies**: Frontend: Vite, Zustand, Tailwind; Backend: SQLAlchemy, Pydantic, Alembic  
**Storage**: PostgreSQL (Cloud SQL) with async SQLAlchemy ORM  
**Testing**: Frontend: Playwright E2E (64 tests); Backend: pytest with async support  
**Target Platform**: GCP Cloud Run (containerized), Cloud Storage for static files
**Project Type**: web (frontend + backend)  
**Performance Goals**: Sub-200ms API response time, real-time WebSocket updates for enterprise tier  
**Constraints**: Event-driven cache invalidation, 3-month dual ID transition, nightly batch processing  
**Scale/Scope**: 42 AI models, 47 dimensions per model, tiered access (free/paid/enterprise)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, backend) ✓
- Using framework directly? Yes - FastAPI/React directly ✓
- Single data model? Yes - Pydantic schemas match DB models ✓
- Avoiding patterns? Yes - Direct service layer, no unnecessary abstractions ✓

**Architecture**:
- EVERY feature as library? No - web app architecture (acceptable for project type)
- Libraries listed: vulca-core (algorithm), vulca-api (endpoints), vulca-ui (components)
- CLI per library: N/A for web app (REST API serves as interface)
- Library docs: API documentation via OpenAPI spec ✓

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - tests written first ✓
- Git commits show tests before implementation? Will be enforced ✓
- Order: Contract→Integration→E2E→Unit strictly followed? Yes ✓
- Real dependencies used? Yes - actual PostgreSQL in tests ✓
- Integration tests for: new libraries, contract changes, shared schemas? Yes ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? Yes - JSON logging ✓
- Frontend logs → backend? Yes - error reporting to API ✓
- Error context sufficient? Yes - request IDs, user context ✓

**Versioning**:
- Version number assigned? 2.0.0 (major for VULCA integration) ✓
- BUILD increments on every change? CI/CD automated ✓
- Breaking changes handled? 3-month dual ID transition plan ✓

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application - frontend + backend detected)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database migrations for UUID and VULCA tables
- Backend API endpoints from OpenAPI contract
- Frontend components for 47D display
- WebSocket implementation for enterprise tier
- Batch processing setup with Celery
- Cache layer with Redis

**Ordering Strategy**:
1. Database schema changes (migrations)
2. Backend models and schemas  
3. API contract tests (must fail first)
4. API endpoint implementation
5. Frontend component tests
6. Frontend implementation
7. Integration tests
8. Performance validation

**Task Categories**:
- [P] Parallel tasks (independent files)
- [S] Sequential tasks (dependencies)
- [T] Test tasks (must fail before implementation)

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md covering:
- 5 database migration tasks
- 8 backend API tasks
- 10 frontend component tasks
- 6 WebSocket/streaming tasks
- 5 batch processing tasks
- 6 integration test tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## 6D to 47D Migration Timeline

**Month 1-3: Dual System Operation**
- Both 6D and 47D systems run in parallel
- API returns both formats with deprecation warnings
- Gradual client migration with support documentation
- Monitor usage metrics for 6D endpoints

**Month 4: Deprecation Phase**
- Mark 6D system as officially deprecated
- Add prominent warnings in API responses
- Email notifications to API consumers
- Provide migration tools and scripts

**Month 6: Complete Migration**
- Remove 6D system entirely
- Archive historical 6D data for reference
- Final cleanup of database columns
- Update all documentation to 47D only

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*