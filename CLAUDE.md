# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - AI art creation evaluation platform for assessing model capabilities in poetry, painting, and narrative arts. Full-stack application with React 19 frontend and FastAPI backend, featuring dual authentication (JWT + guest mode), async AI evaluation engine, and real-time progress visualization.

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
npm run build        # TypeScript check + production build (may need --skipLibCheck for type issues)
npm run lint         # ESLint validation
npm run preview      # Preview production build
npx vite build       # Build without TypeScript check if needed
```

### Backend (wenxin-backend)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data
pytest                                                 # Run unit tests
pytest tests/test_auth.py -v                         # Run specific test verbose
```

### Production Deployment
```bash
# Docker-based deployment
./deploy.sh --init                                    # First deployment with data initialization
./deploy.sh                                          # Update deployment

# Manual deployment
docker-compose -f docker-compose.prod.yml up -d      # Start production services
docker-compose -f docker-compose.prod.yml logs -f     # Monitor logs
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
    API Calls ──────────────→     Async Handlers                 - evaluation_results
```

### Backend Service-Oriented Architecture
**Core Services:**
- `EvaluationEngine`: Manages async evaluation task processing with progress tracking
- `MockProvider`: Simulates AI model interactions for development/testing
- `ScoringAdvisor`: Provides task-specific evaluation guidance and scoring templates
- `AuthenticationSystem`: Handles dual authentication (JWT + Guest sessions)

**Data Flow Pattern:**
```python
API Request → Router → Dependencies (Auth/DB) → Service Layer → SQLAlchemy Model → Database
            ↓
Background Task → EvaluationEngine → MockProvider → Database Update
```

### Frontend Component Architecture
**Hook-Based Service Pattern:**
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

**State Management:**
- **Zustand Stores**: UI state (view modes, sort options), filter state
- **React State**: Component-local state, form state  
- **Custom Hooks**: Business logic abstraction, API state management

## Critical Implementation Details

### Dual Authentication Architecture
Platform supports both authenticated users and anonymous guest sessions:

**Frontend Guest Session Management:**
```typescript
// Uses native crypto.randomUUID() for React 19 compatibility
const guestSession = {
  id: crypto.randomUUID(),
  dailyUsage: 0,
  lastReset: new Date().toDateString(),
  evaluations: []
};

// Guest headers sent with each API request
const guestHeaders = { 'X-Guest-ID': session.id };
```

**Backend Mixed Authentication:**
```python
# app/api/deps.py - Critical dependency pattern
async def get_current_user_or_guest(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Union[User, GuestSession]:
    # Try JWT first, fallback to guest session
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # JWT token validation
    else:
        guest_id = request.headers.get("x-guest-id") or str(uuid.uuid4())
        return GuestSession(guest_id)
```

### Evaluation Task Processing System
**Async Background Processing:**
```python
# EvaluationEngine handles task execution with realistic progress simulation
class EvaluationEngine:
    async def execute_evaluation(self, task_id: str):
        # Multi-stage progress with task-specific delays
        stage_delays = {
            "poem": [15, 45, 30, 20],      # analyzing, generating, refining, evaluating
            "story": [20, 35, 60, 25],     # analyzing, structuring, writing, evaluating
            "painting": [18, 40, 80, 22],  # analyzing, composing, rendering, evaluating
            "music": [25, 70, 50, 18]      # analyzing, composing, arranging, evaluating
        }
```

**Frontend Progress Visualization:**
- Real-time multi-stage progress tracking with animations
- Task-specific stage definitions and estimated durations
- Progress state synchronization with backend task status

### Database Schema Design
**Dynamic ID Support** for SQLite/PostgreSQL compatibility:
```python
# Models support both database types
if settings.DATABASE_URL.startswith("sqlite"):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("ai_models.id"))
else:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"))
```

**Guest Support in Data Models:**
```python
# evaluation_task.py supports both authenticated and guest users
user_id = Column(String, ForeignKey("users.id"), nullable=True)
guest_id = Column(String, nullable=True)  # For anonymous evaluation sessions
```

### API Data Format Patterns
**Backend Response Structure:**
- Most endpoints return arrays directly (not wrapped in pagination objects)
- Status field mapping: `running` → `processing` (frontend), `pending` → `pending`
- Snake_case backend fields converted to camelCase on frontend

**Critical API Response Handling:**
```typescript
// evaluations.service.ts - Handle direct array responses
const response = await apiClient.get<EvaluationTaskResponse[]>('/evaluations/');
const evaluationsArray = Array.isArray(response.data) ? response.data : [];
```

**URL Requirements:**
```typescript
// FastAPI requires trailing slashes to avoid 307 redirects
await apiClient.get('/models/');    // ✓ Correct
await apiClient.get('/models');     // ✗ Causes 307 redirect
```

### React 19 Specific Requirements
**UUID Generation Compatibility:**
```typescript
// ✓ Use native crypto API - React 19 compatible
const id = crypto.randomUUID();

// ✗ Avoid uuid package - causes peer dependency conflicts
import { v4 as uuidv4 } from 'uuid';
```

**Package Version Requirements:**
- `framer-motion`: 12.23+ for React 19 support
- `tailwindcss`: 4.1+ for latest features
- Avoid UUID dependencies that conflict with React 19

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
- 4 sample battles with voting data
- 6 sample artworks across different categories
- 4 evaluation tasks with status progression (pending → running → completed)
- Admin account: username="admin", password="admin123"

### Schema Change Management
**No migrations system** - schema changes require database recreation:
```bash
cd wenxin-backend
rm wenxin.db                    # Delete existing database
python init_db.py               # Recreate with new schema + sample data
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
USE_REDIS=False                    # Simplified deployment - no Redis dependency
USE_QDRANT=False                  # No vector database integration
```

## Smart UI System Components

### Multi-Trigger Login Prompts
**Trigger Scenarios with Urgency Levels:**
- `limit_reached`: Guest daily limit hit (urgency: high, immediate action required)
- `save_progress`: After 2+ evaluations (urgency: medium, suggest account creation)
- `extended_use`: After 10+ minutes session (urgency: low, gentle encouragement)
- `quality_feedback`: When viewing detailed results (urgency: low, value-add suggestion)

### Progress Visualization System
**Task-Specific Stage Definitions:**
```typescript
const progressStages = {
  poem: ['分析提示词', '构思创作', '润色优化', '质量评估'],
  story: ['理解需求', '构建框架', '内容创作', '综合评估'],
  painting: ['主题分析', '构图设计', '图像生成', '美学评估'],
  music: ['风格分析', '旋律创作', '编曲制作', '音乐评估']
};
```

## Development Patterns & Conventions

### Adding New Features
1. **Backend**: Model → Schema → Router → Service → Register in `__init__.py`
2. **Frontend**: Types → Service → Hook → Component → Route → UI Integration

### SQLAlchemy Best Practices
**Always use eager loading for relationships:**
```python
from sqlalchemy.orm import selectinload
query = select(EvaluationTask).options(
    selectinload(EvaluationTask.model),
    selectinload(EvaluationTask.user)
)
```

### Service Layer Pattern
**Frontend Service Layer Structure:**
```typescript
// services/*.service.ts - Consistent pattern across all services
class ServiceName {
  async getResource(): Promise<Resource[]> {
    const response = await apiClient.get<ResourceResponse[]>('/resource/');
    return Array.isArray(response.data) ? response.data.map(convert) : [];
  }
}
```

### TypeScript Configuration Considerations
**Build Issues**: If encountering TypeScript strict checking errors during build:
```bash
# Temporary solution for type conflicts
npx vite build                    # Build without TypeScript check
# Or modify tsconfig.app.json to disable strict unused variable checking
"noUnusedLocals": false,
"noUnusedParameters": false,
```

## System Status & Limitations

### Operational Components
- Frontend: React 19 + TypeScript + Tailwind CSS 4.1 + Framer Motion
- Backend: FastAPI + SQLAlchemy async + SQLite + Background Tasks
- Authentication: Dual mode (JWT + Guest sessions)
- Task Processing: Async evaluation engine with progress simulation
- State Management: Zustand for global state, React hooks for local state

### Known Limitations & Design Decisions
- **Mock AI Provider Only**: No real LLM integration (uses simulated responses)
- **SQLite Database**: Simplified deployment, no migration system
- **No Real-time Updates**: Uses polling instead of WebSocket
- **No File Upload**: Artwork images are URL references only
- **Simplified Task Queue**: FastAPI BackgroundTasks instead of Redis/Celery
- **No Vector Database**: Qdrant integration disabled for simplified deployment

## Troubleshooting Guide

### API Authentication Issues
**Common Problem**: `/api/v1/evaluations/` returns 401 errors despite guest mode
**Solutions**:
1. Verify `oauth2_scheme` has `auto_error=False` in `deps.py`
2. Check `X-Guest-ID` header is being sent from frontend
3. Restart FastAPI server completely (auto-reload may miss dependency changes)
4. Test API manually: `curl -H "X-Guest-ID: test-123" http://localhost:8001/api/v1/evaluations/`

### Frontend Data Fetching Errors
**Common Problem**: `TypeError: Cannot read properties of undefined (reading 'map')`
**Root Cause**: API response structure mismatch (backend returns array, frontend expects wrapped object)
**Solution**: Ensure service layer handles direct array responses with `Array.isArray()` checks

### React 19 Compatibility Issues
**Package Conflicts**: Clear cache and reinstall if peer dependency errors occur
```bash
rm -rf node_modules package-lock.json && npm install
```

### Port Conflicts
- Frontend auto-increments ports: 5173 → 5174 → 5175 → 5176...
- Backend fixed on port 8001
- Check processes: `netstat -ano | findstr :5173` (Windows)

### Build Configuration Issues
**TypeScript Build Failures**: Common with unused imports/variables
- Use `npx vite build` to bypass TypeScript checking
- Or temporarily modify `tsconfig.app.json` to relax strict checking

### Backend URL Access
**Important**: Users may accidentally access backend URL (http://localhost:8001/) instead of frontend
- Backend now serves HTML redirect page pointing to frontend
- Proper frontend URL: http://localhost:5175 (or auto-assigned port)
- Backend API docs: http://localhost:8001/docs

### Windows-Specific Development
- Use `python -m uvicorn` instead of `uvicorn` directly
- Kill stuck processes: `taskkill /F /IM python.exe`
- Reserved device names (nul, con, aux) added to .gitignore

## Security & Quality Assurance

### Security Headers Implementation
Backend includes comprehensive security middleware:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Cache-Control: no-cache, no-store, must-revalidate

### Accessibility Features
- Proper HTML lang attributes
- Form labels with htmlFor associations
- Semantic HTML structure
- Keyboard navigation support

### Browser Compatibility
- CSS vendor prefix handling in `browser-compat.css`
- Mobile-responsive design
- Cross-browser testing considerations