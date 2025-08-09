# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - AI art creation evaluation platform for assessing model capabilities in poetry, painting, and narrative arts. Full-stack application with React 19 frontend and FastAPI backend, featuring guest mode, AI scoring assistance, and real-time progress visualization.

## Essential Commands

### Quick Start (Windows)
```bash
start.bat                                              # One-click startup (recommended)

# Or manual startup in separate terminals:
cd wenxin-backend && python init_db.py                # Initialize database
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev                        # Frontend (auto-detects available port 5173+)
```

### Frontend (wenxin-moyun)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (auto-increments port from 5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint validation
npm run preview      # Preview production build
```

### Backend (wenxin-backend)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data
python test_apis.py                                   # Run API endpoint tests
pytest                                                 # Run unit tests
pytest tests/test_auth.py -v                         # Run specific test verbose
```

## Architecture Overview

### Three-Layer Architecture
```
Frontend (React 19/TypeScript)     Backend (FastAPI/Python)      Database (SQLite/PostgreSQL)
        ↓                               ↓                              ↓
    Components                      Routers                        Tables
        ↓                               ↓                              ↓
    Custom Hooks                   Services/Deps                  - users
        ↓                               ↓                          - ai_models
    Service Layer                  Pydantic Schemas               - battles
        ↓                               ↓                          - battle_votes
    Axios Client                   SQLAlchemy Models              - artworks
        ↓                               ↓                          - evaluation_tasks
    API Calls ──────────────→     Async Handlers                  
```

### Frontend Service Pattern
```typescript
Component (e.g., EvaluationsPage.tsx)
    ↓ uses
Custom Hook (e.g., useEvaluations.ts)
    ↓ calls
Service Layer (e.g., evaluations.service.ts)
    ↓ uses
Axios Instance (api.ts with interceptors)
    ↓ requests
Backend API (/api/v1/*)
```

### Backend Async Pattern
```python
@router.get("/resource")
async def get_resource(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    query = select(Model).options(selectinload(Model.relation))
    result = await db.execute(query)
    return result.scalars().all()
```

## Critical Implementation Details

### Guest Mode Architecture
The platform supports both authenticated users and guest sessions:

```typescript
// Guest session management (React 19 compatible)
const guestSession = {
  id: crypto.randomUUID(),         // Uses native crypto API instead of uuid package
  dailyUsage: 0,
  lastReset: new Date().toDateString(),
  evaluations: []
};
```

**Backend Dependencies Pattern:**
```python
# Mixed authentication - supports both JWT and guest sessions
async def get_current_user_or_guest(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Union[User, GuestSession]:
    # Try JWT first, fallback to guest session via X-Guest-ID header
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # JWT authentication
    else:
        guest_id = request.headers.get("x-guest-id") or str(uuid.uuid4())
        return GuestSession(guest_id)
```

### API Service Import Pattern
```typescript
// api.ts uses default export
import apiClient from './api';              // ✓ Correct
import { apiClient } from './api';          // ✗ Wrong - will cause import error
```

### Frontend Routing Structure
```tsx
// Login page without Layout
<Route path="/login" element={<LoginPage />} />

// Other pages with Layout (using Outlet)
<Route element={<Layout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/evaluations" element={<EvaluationsPage />} />
</Route>
```

### Authentication Flow
**Dual Authentication System:**
1. **JWT Authentication**: OAuth2 form-data format
2. **Guest Mode**: X-Guest-ID header with daily limits (3 evaluations/day)

```typescript
// Login request format (authenticated users)
const formParams = new URLSearchParams();
formParams.append('username', username);
formParams.append('password', password);
apiClient.post('/auth/login', formParams, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

// Guest mode headers (unauthenticated users)
const guestHeaders = {
  'X-Guest-ID': guestSession.id
};
```

### SQLAlchemy Async Relationships
Always use `selectinload` for eager loading:
```python
from sqlalchemy.orm import selectinload
query = select(Battle).options(
    selectinload(Battle.model_a),
    selectinload(Battle.model_b)
)
```

### Type Conversion Pattern
Backend returns snake_case, frontend uses camelCase:
```typescript
function convertToEvaluationTask(response: EvaluationTaskResponse): EvaluationTask {
    return {
        modelId: response.model_id,        // snake_case → camelCase
        taskType: response.task_type,
        createdAt: response.created_at
    };
}
```

### API URL Trailing Slashes
FastAPI requires trailing slashes to avoid 307 redirects:
```typescript
await apiClient.get('/models/');    // ✓ Correct
await apiClient.get('/models');     // ✗ Causes 307 redirect
```

### React 19 Compatibility Notes
**UUID Generation**: Use native `crypto.randomUUID()` instead of uuid package:
```typescript
// ✓ Correct - React 19 compatible
const id = crypto.randomUUID();

// ✗ Avoid - causes peer dependency conflicts with React 19
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
```

**Task Status Tracking**: Use `TaskStatus` enum for evaluation states:
```typescript
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - OAuth2 form-data login (returns JWT)
- `POST /api/v1/auth/register` - User registration

### Core Resources (all require trailing slashes)
- `/api/v1/models/` - AI model management
- `/api/v1/battles/` - Battle system with voting  
- `/api/v1/artworks/` - Creative works
- `/api/v1/evaluations/` - AI evaluation tasks (supports guest mode)
- `/api/v1/scoring-advice/` - AI scoring advice and templates

### Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Database Management

### Sample Data (via init_db.py)
- 10 AI models (GPT-4, Claude, Qwen, etc.)
- 4 sample battles
- 6 sample artworks  
- 4 evaluation tasks with status progression (pending → running → completed)
- Admin account: username="admin", password="admin123"

**Guest Field Support**: All evaluation models include `guest_id` field for anonymous users:
```python
# evaluation_task.py model supports guest sessions
guest_id = Column(String, nullable=True)  # For guest users
user_id = Column(String, ForeignKey("users.id"), nullable=True)  # For authenticated users
```

### Dynamic ID Support
Models support both SQLite and PostgreSQL:
```python
if settings.DATABASE_URL.startswith("sqlite"):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
else:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

## Environment Configuration

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8001
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
```

### Backend (.env)
```bash
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
USE_REDIS=False
USE_QDRANT=False
```

## Common Development Tasks

### Adding New API Resource
1. Backend: Create model → schema → router → register in `__init__.py`
2. Frontend: Create types → service → hook → component → route

### Evaluation Task System
**Core Features:**
- Mock AI provider for testing without real APIs
- Async background task execution with real-time status tracking
- Task-specific progress visualization (poem: 4 stages, story: 4 stages, etc.)
- AI scoring advisor with task-type specific templates
- Guest mode with daily limits (3 evaluations/day)
- Human rating overlay on AI scores

**Key Components:**
- `EvaluationEngine`: Processes tasks asynchronously with simulated delays
- `ScoringAdvisor`: Provides task-specific scoring guidance 
- `ProgressVisualizer`: Real-time multi-stage progress tracking
- `LoginPrompt`: Smart login prompts with multiple trigger scenarios

### Smart UI Systems
**Login Prompts**: Triggered by multiple scenarios:
- `limit_reached`: Guest user hits daily limit (urgency: high)
- `save_progress`: After 2+ evaluations (urgency: medium) 
- `extended_use`: After 10+ minutes session (urgency: low)
- `quality_feedback`: When viewing detailed results (urgency: low)

**Progress Stages** (task-type specific):
```typescript
poem: ['分析提示词', '构思创作', '润色优化', '质量评估']
story: ['理解需求', '构建框架', '内容创作', '综合评估']  
painting: ['主题分析', '构图设计', '图像生成', '美学评估']
music: ['风格分析', '旋律创作', '编曲制作', '音乐评估']
```

### Windows-Specific Notes
- Use `python -m uvicorn` instead of `uvicorn` directly
- Kill stuck processes: `taskkill /F /IM python.exe`
- Frontend auto-increments ports from 5173 if occupied (5174, 5175, 5176...)
- Reserved device names (nul, con, aux) added to .gitignore

## Current Development Status

### Recently Completed
- ✅ **Guest Mode System**: Complete guest session management with daily limits
- ✅ **Mixed Authentication**: JWT + guest session support in all endpoints
- ✅ **Smart Login Prompts**: Multi-trigger system with urgency levels
- ✅ **AI Scoring Advice**: Task-specific templates and scoring guidance
- ✅ **Progress Visualization**: Real-time multi-stage progress tracking
- ✅ **React 19 Compatibility**: Native crypto.randomUUID() integration
- ✅ **Background Task Processing**: Async evaluation engine with status updates
- ✅ **API Authentication Issues**: Fixed OAuth2 dependency conflicts

### Current System Status
**Operational Components:**
- Frontend: React 19 + TypeScript + Tailwind CSS 4.1
- Backend: FastAPI + SQLAlchemy async + SQLite
- Authentication: Dual mode (JWT + Guest sessions)
- Task Processing: Background async with progress simulation
- UI Features: Progress viz, scoring advice, smart prompts

### Known Limitations
- Mock AI provider only (no real LLM integration)
- SQLite database (no migrations, recreates on schema changes)
- No WebSocket for real-time updates
- No file upload for artwork images
- No Redis/Celery integration (uses FastAPI BackgroundTasks)

## Troubleshooting Common Issues

### Authentication API Returning 401 Errors
If `/api/v1/evaluations/` returns 401 despite guest mode implementation:
1. **Check OAuth2 Dependency**: Ensure `oauth2_scheme` has `auto_error=False`
2. **Verify Function Calls**: Add debug logging to `get_current_user_or_guest` to confirm it's being called
3. **Restart Server**: FastAPI auto-reload sometimes misses dependency changes
4. **Test Headers**: Ensure `X-Guest-ID` header is being sent correctly

```bash
# Test guest mode API manually
curl -H "X-Guest-ID: test-123" http://localhost:8001/api/v1/evaluations/
```

### React 19 Package Conflicts
If npm install fails with peer dependency errors:
- **UUID Package**: Use `crypto.randomUUID()` instead of uuid package
- **Framer Motion**: Ensure version 12.23+ for React 19 compatibility
- **Clear Cache**: `rm -rf node_modules package-lock.json && npm install`

### Port Conflicts
- Frontend auto-detects ports: 5173 → 5174 → 5175 → 5176...
- Backend fixed on port 8001
- Check running processes: `netstat -ano | findstr :5173`

### Database Schema Changes
Since no migrations exist, schema changes require:
```bash
cd wenxin-backend
rm wenxin.db                    # Delete existing database
python init_db.py               # Recreate with new schema
```

### Background Task Not Processing
If evaluations stay "pending":
1. Check server logs for task execution errors
2. Verify `EvaluationEngine` import paths
3. Ensure database connections in background tasks
4. Mock provider delays may be too long for testing