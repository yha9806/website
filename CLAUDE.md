# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - AI art creation evaluation platform for assessing model capabilities in poetry, painting, and narrative arts.

## Essential Commands

### Quick Start
```bash
# Windows one-click startup
start.bat

# Manual startup (run in separate terminals)
cd wenxin-backend && python init_db.py                                      # Initialize database
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001   # Backend API
cd wenxin-moyun && npm run dev                                             # Frontend dev server
```

### Frontend (wenxin-moyun)
```bash
npm run dev          # Start Vite dev server (port 5173+)
npm run build        # TypeScript check + production build
npm run lint         # ESLint validation
npm run preview      # Preview production build
```

### Backend (wenxin-backend)
```bash
python -m uvicorn app.main:app --reload --port 8001    # Start API server
python init_db.py                                      # Reset database with sample data
pytest                                                  # Run all tests
pytest tests/test_auth.py -v                          # Run specific test verbose
pytest --cov=app tests/                               # Generate coverage report
```

## Architecture Overview

### Three-Layer Architecture
```
Frontend (React/TypeScript)     Backend (FastAPI/Python)      Database (SQLite/PostgreSQL)
        ↓                               ↓                              ↓
    Components                      Routers                        Tables
        ↓                               ↓                              ↓
    Custom Hooks                   Services/Deps                  - users
        ↓                               ↓                          - ai_models
    Service Layer                  Pydantic Schemas               - battles
        ↓                               ↓                          - battle_votes
    Axios Client                   SQLAlchemy Models              - artworks
        ↓                               ↓                          - works
    API Calls ──────────────→     Async Handlers                  - evaluation_*
```

### Frontend Service Pattern
All API interactions follow this consistent pattern:
```typescript
Component (e.g., BattlePage.tsx)
    ↓ uses
Custom Hook (e.g., useBattles.ts)
    ↓ calls
Service Layer (e.g., battles.service.ts)
    ↓ uses
Axios Instance (api.ts with interceptors)
    ↓ requests
Backend API (/api/v1/*)
```

### Backend Async Pattern
```python
@router.get("/resource")
async def get_resource(
    db: AsyncSession = Depends(get_db),                    # Dependency injection
    current_user: User = Depends(get_current_user_optional) # Auth (optional)
):
    query = select(Model).options(selectinload(Model.relation))  # Eager loading for relations
    result = await db.execute(query)
    return result.scalars().all()
```

## Critical Implementation Details

### SQLAlchemy Async Relationship Loading
When querying models with relationships, use `selectinload`:
```python
from sqlalchemy.orm import selectinload

query = select(Battle).options(
    selectinload(Battle.model_a),
    selectinload(Battle.model_b)
)
```

### Dynamic Database ID Support
Models support both SQLite (String) and PostgreSQL (UUID):
```python
if settings.DATABASE_URL.startswith("sqlite"):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
else:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

### Frontend Type Conversion
API responses (snake_case) are converted to frontend types (camelCase):
```typescript
convertToFrontendModel(apiModel: AIModelResponse): Model {
    return {
        overallScore: apiModel.overall_score,
        releaseDate: apiModel.created_at.substring(0, 10),
        // ...
    };
}
```

### Mock Data Fallback
Hooks automatically fallback to mock data when API fails:
```typescript
try {
    const response = await battlesService.getBattles();
    setBattles(response.battles);
} catch {
    // Fallback to mock data
    setBattles([]);
}
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login (returns JWT)
- `POST /api/v1/auth/register` - Register new user

### AI Models
- `GET /api/v1/models/` - List models
- `GET /api/v1/models/{id}` - Get model details
- `POST/PUT/DELETE /api/v1/models/` - Admin operations

### Battles (对战系统)
- `GET /api/v1/battles/` - List battles
- `GET /api/v1/battles/random` - Get random active battle
- `POST /api/v1/battles/{id}/vote` - Vote in battle
- `POST /api/v1/battles/` - Create battle (admin)
- `PATCH /api/v1/battles/{id}/complete` - Complete battle (admin)

### Artworks (作品系统)
- `GET /api/v1/artworks/` - List artworks (filter by model_id, type)
- `GET /api/v1/artworks/{id}` - Get artwork details
- `POST/PUT/DELETE /api/v1/artworks/` - Admin operations

### API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Database Schema

### Core Tables
- `users` - User accounts with JWT auth
- `ai_models` - AI model profiles with metrics JSON
- `battles` - Battle records between two models
- `battle_votes` - Vote records with IP tracking
- `artworks` - Creative works by models
- `works` - Legacy work storage (being migrated to artworks)
- `evaluation_*` - Evaluation system tables

### Sample Data (init_db.py)
- 10 AI models (GPT-4, Claude, Qwen, etc.)
- 4 sample battles (active and completed)
- 6 sample artworks (poems, paintings, stories)
- Admin user: username="admin", password="admin123"

## Configuration

### Environment Variables
```bash
# Frontend (wenxin-moyun/.env)
VITE_API_BASE_URL=http://localhost:8001
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000

# Backend (wenxin-backend/.env)
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
USE_REDIS=False
USE_QDRANT=False
```

### CORS Origins (hardcoded in app/main.py)
```python
["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173"]
```

## Common Development Tasks

### Adding New API Resource
1. Create model in `app/models/{resource}.py`
2. Create schema in `app/schemas/{resource}.py`
3. Create router in `app/api/v1/{resource}.py`
4. Register router in `app/api/v1/__init__.py`
5. Create service in `src/services/{resource}.service.ts`
6. Create hook in `src/hooks/use{Resource}.ts`
7. Update types in `src/types/types.ts`

### Database Schema Changes
1. Modify SQLAlchemy model in `app/models/`
2. Update Pydantic schema in `app/schemas/`
3. Run `python init_db.py` to recreate database
4. Note: No migrations configured for SQLite

## Known Issues

### Battle API Relationship Loading
Battle endpoints may fail with "MissingGreenlet" error. Solution:
```python
# Add selectinload for relationships
query = select(Battle).options(
    selectinload(Battle.model_a),
    selectinload(Battle.model_b)
)
```

### TypeScript Import Errors
Use `import type` for type-only imports:
```typescript
import type { Model } from '../types/types';  // ✓ Correct
```

### Windows-Specific Issues
- Use `python -m uvicorn` instead of `uvicorn` directly
- Kill stuck processes: `taskkill /F /IM python.exe`

### Port Conflicts
- Frontend: Vite auto-increments from 5173
- Backend: Manually change if 8001 is occupied

## Testing

### Backend
```bash
pytest tests/test_auth.py::test_login    # Specific test
pytest -k "login or register"            # Pattern matching
pytest --cov=app --cov-report=html      # Coverage report
```

### Frontend
Not configured. Recommended: Vite + Vitest

## Production Deployment

1. Switch to PostgreSQL: Update `DATABASE_URL`
2. Enable Redis: Set `USE_REDIS=True`
3. Configure Alembic migrations
4. Update CORS origins in `app/main.py`
5. Set strong `SECRET_KEY`
6. Add rate limiting middleware