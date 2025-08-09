# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - AI art creation evaluation platform for assessing model capabilities in poetry, painting, and narrative arts.

## Essential Commands

### Quick Start (Windows)
```bash
# One-click startup
start.bat

# Manual startup (run in separate terminals)
cd wenxin-backend && python init_db.py                                      # Initialize database
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001   # Backend API
cd wenxin-moyun && npm install && npm run dev                              # Frontend dev server
```

### Frontend (wenxin-moyun)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 5173+)
npm run build        # TypeScript check + production build
npm run lint         # ESLint validation
npm run preview      # Preview production build
```

### Backend (wenxin-backend)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data
pytest                                                 # Run all tests
pytest tests/test_auth.py -v                         # Run specific test verbose
pytest --cov=app tests/                              # Generate coverage report
```

### Testing
```bash
# API endpoint testing
python test_apis.py                                   # Run comprehensive API tests

# Docker development
docker-compose -f docker-compose.dev.yml up --build   # Start dev environment
docker-compose -f docker-compose.prod.yml up --build  # Start prod environment
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
    API Calls ──────────────→     Async Handlers                  - evaluation_tasks
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
When querying models with relationships, always use `selectinload` to avoid lazy loading issues:
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
API responses (snake_case) must be converted to frontend types (camelCase):
```typescript
// In hooks or services
function convertToBattle(response: BattleResponse): Battle {
    return {
        id: response.id,
        modelA: response.model_a,
        modelB: response.model_b,
        votesA: response.votes_a,
        votesB: response.votes_b,
        // ...
    };
}
```

### TypeScript Import Pattern
Always use type-only imports for TypeScript types:
```typescript
import type { Model, Battle } from '../types/types';  // ✓ Correct
import { Model } from '../types/types';               // ✗ Will cause build errors
```

### Mock Data Fallback Strategy
Hooks should gracefully fallback to mock data when API fails:
```typescript
try {
    const response = await battlesService.getBattles();
    setBattles(response.battles);
} catch {
    const { mockBattles } = await import('../data/mockData');
    setBattles(mockBattles);
}
```

### Authentication Handling
Backend uses OAuth2PasswordBearer with form-data (not JSON):
```python
# Correct login endpoint usage
form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm)

# Optional auth for public endpoints
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
current_user: Optional[User] = Depends(get_current_user_optional)
```

### API URL Formatting
Always include trailing slashes for FastAPI endpoints to avoid 307 redirects:
```typescript
await apiClient.get('/models/');   // ✓ Correct
await apiClient.get('/models');    // ✗ Causes redirect
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Form-encoded login (returns JWT)
- `POST /api/v1/auth/register` - Register new user

### Core Resources
- Models: `/api/v1/models/` - AI model CRUD operations
- Battles: `/api/v1/battles/` - Battle system with voting
- Artworks: `/api/v1/artworks/` - Creative works management
- Evaluations: `/api/v1/evaluations/` - AI evaluation tasks

### API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Database Management

### Sample Data
Running `python init_db.py` creates:
- 10 AI models (GPT-4, Claude, Qwen, etc.)
- 4 sample battles (active and completed)
- 6 sample artworks (poems, paintings, stories)
- 4 evaluation tasks (with scores and metrics)
- Admin user: username="admin", password="admin123"

### Schema Changes
1. Modify SQLAlchemy model in `app/models/`
2. Update Pydantic schema in `app/schemas/`
3. Run `python init_db.py` to recreate database
4. Note: No migrations configured for SQLite

### Model Relationships
- Battle ←→ AIModel (many-to-many through model_a/model_b)
- Artwork → AIModel (many-to-one)
- EvaluationTask → AIModel (many-to-one)
- EvaluationTask → User (optional many-to-one)

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

### CORS Configuration
Update origins in `app/main.py` for production:
```python
origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://127.0.0.1:5173"
]
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

### Running Evaluation Tasks
The evaluation system uses background tasks:
```python
# Create evaluation task (triggers background execution)
POST /api/v1/evaluations/
{
    "model_id": "uuid",
    "task_type": "poem|story|painting|music",
    "prompt": "Task description",
    "parameters": {}
}
```

### Windows-Specific Issues
- Use `python -m uvicorn` instead of `uvicorn` directly
- Chinese encoding: Ensure UTF-8 in `init_db.py`
- Kill stuck processes: `taskkill /F /IM python.exe`
- Port conflicts: Vite auto-increments from 5173

## Production Deployment

### Using Docker Compose
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
cp .env.production .env
./deploy.sh --init  # First deployment
./deploy.sh         # Updates
```

### Key Production Changes
1. Switch to PostgreSQL: Update `DATABASE_URL`
2. Enable Redis: Set `USE_REDIS=True`
3. Configure strong `SECRET_KEY`
4. Update CORS origins in `app/main.py`
5. Set up SSL certificates for HTTPS

## Current Development Status

### Completed Features
- User authentication system (JWT)
- AI model CRUD operations
- Battle system with voting
- Artwork management
- Evaluation task system with mock AI provider
- Frontend components for all major features

### Known Issues
- Login requires form-data format (not JSON)
- Optional authentication on evaluation endpoints needs frontend token handling
- Old evaluation model conflicts (renamed to OldEvaluationTask)

### Active Services
When developing, ensure these services are running:
- Backend API: Port 8001
- Frontend Dev Server: Port 5173+ (auto-increments if occupied)
- Database: SQLite file (wenxin-backend/wenxin.db)