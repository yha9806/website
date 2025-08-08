# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - An AI art creation capability evaluation platform specializing in assessing AI models' creativity, aesthetic value, and cultural compatibility in poetry, painting, and narrative arts.

## Essential Commands

### Quick Start (Full Stack - Simplified)
```bash
# Windows (one-click startup)
start.bat

# Linux/Mac  
./start.sh

# Manual start sequence (no Docker required):
1. cd wenxin-backend && python init_db.py      # Initialize SQLite database with sample data
2. cd wenxin-backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
3. cd wenxin-moyun && npm run dev              # Starts on port 5173
```

### Frontend Commands (wenxin-moyun)
```bash
npm run dev          # Start dev server on http://localhost:5173
npm run build        # TypeScript check + Vite build  
npm run preview      # Preview production build
npm run lint         # Run ESLint checks
```

### Backend Commands (wenxin-backend)
```bash
# Development
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Database (SQLite by default)
python init_db.py              # Initialize database with 10 sample AI models
# Note: Database migrations (alembic) not configured yet for SQLite

# Testing
pytest                         # Run all tests
pytest tests/test_auth.py      # Run specific test file
pytest -k "test_login"         # Run tests matching pattern
pytest --cov=app tests/        # Run with coverage report
pytest -v                      # Verbose output

# Docker services (optional - not required for development)
docker-compose up -d           # Start PostgreSQL, Redis, Qdrant (if needed)
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
```

## High-Level Architecture

### Cross-Service Communication Flow

The platform uses a simplified architecture for development, with production-ready patterns:

1. **Frontend → Backend API**: All frontend requests go through Axios interceptors (`src/services/api.ts`) which handle JWT tokens and error responses
2. **Backend → Database**: SQLAlchemy async sessions manage database operations (SQLite for dev, PostgreSQL for production)
3. **Backend → Cache**: In-memory cache service (`app/services/cache.py`) replaces Redis during development
4. **API Fallback**: Frontend hooks (`useModels`, `useLeaderboard`) automatically fall back to mock data if API fails
5. **Future Services**: LangChain (AI evaluation) and Qdrant (vector search) integration points ready but not required

### Authentication & Authorization Flow

```
User Login → Frontend → POST /api/v1/auth/login → Backend validates credentials
    ↓                                                    ↓
Store JWT token                                   Return JWT + user info
    ↓                                                    
All API requests include Bearer token → Backend validates token → Process request
```

- JWT tokens expire after 7 days (configurable in `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Admin routes require `is_superuser=True` in user model
- Token validation happens in `app/api/deps.py:get_current_user`

### Data Flow for Model Display

1. **Model List**: Frontend requests models via GET `/api/v1/models/`
2. **Backend Query**: SQLAlchemy fetches from SQLite/PostgreSQL 
3. **Response Transform**: Backend converts DB models to API schemas
4. **Frontend Conversion**: `modelsService.convertToFrontendModel()` maps API response to UI types
5. **Fallback Logic**: If API fails, hooks automatically load from `mockData.ts`

### Frontend State Management

Currently using React local state with data flow:
- `mockData.ts` provides static data during development
- `useModels` and `useLeaderboard` hooks manage data fetching
- Components receive data via props (no global state management yet)
- API integration ready but currently returns to mock data on failure

### Backend Service Dependencies

```
FastAPI Application (app.main)
    ├── Database Layer (app.core.database)
    │   ├── SQLAlchemy Models (app.models/)
    │   └── Auto-detects SQLite vs PostgreSQL from DATABASE_URL
    ├── Authentication (app.core.security)
    │   └── JWT token management with passlib bcrypt
    ├── API Routes (app.api.v1/)
    │   ├── /auth - Login/register endpoints
    │   └── /models - AI model CRUD operations
    └── Services
        └── cache.py - In-memory cache (replaces Redis for dev)
```

## Critical Configuration Details

### Database Configuration

The backend automatically detects database type from `DATABASE_URL` in `.env`:
- **SQLite** (default): `sqlite+aiosqlite:///./wenxin.db` - No setup required
- **PostgreSQL** (production): `postgresql+asyncpg://user:pass@host:port/db` - Requires Docker

Key implementation detail in `app/models/ai_model.py`:
- SQLite uses String IDs: `id = Column(String, primary_key=True)`
- PostgreSQL uses UUIDs: `id = Column(UUID(as_uuid=True), primary_key=True)`

### CORS Configuration

CORS is hardcoded in `app/main.py` for development convenience:
```python
cors_origins = [
    "http://localhost:5173",  # Primary Vite port
    "http://localhost:5174",  # Fallback ports
    "http://localhost:5175",
    "http://127.0.0.1:5173",  # Alternative localhost
]
```
For production, update these origins to your actual domain.

### API Response Patterns

All API endpoints follow consistent response patterns:
- Success: Return data directly or `{"detail": "Success message"}`
- Error: `{"detail": "Error description"}` with appropriate HTTP status
- Validation errors: `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`

## Development Workflow Patterns

### Adding New Evaluation Metrics

1. Update metrics JSON in `app/models/ai_model.py` 
2. Modify `app/schemas/ai_model.py` for API serialization
3. Update `ModelMetrics` interface in `src/types/types.ts`
4. Add to radar chart data in `ComparisonRadar.tsx`

### Implementing New API Endpoints

1. Create route handler in appropriate file under `app/api/v1/`
2. Define Pydantic schemas in `app/schemas/`
3. Add service logic if complex (create under `app/services/`)
4. Update frontend service in `src/services/`
5. Create React hook for data fetching in `src/hooks/`

### Frontend-Backend Integration Steps

1. Ensure backend endpoint works via Swagger UI (http://localhost:8001/docs)
2. Update frontend service file with new API call
3. Replace mock data usage with actual API call
4. Handle loading and error states in component
5. Test with both success and failure scenarios

## Troubleshooting Guide

### Frontend Build/Runtime Issues

- **Module not found**: Clear Vite cache with `rm -rf node_modules/.vite` (or delete manually on Windows)
- **Type import errors**: Use `import type` instead of regular import for TypeScript types
- **Port already in use**: Vite auto-increments (5173→5174→5175), check console for actual port
- **API connection failed**: Verify `VITE_API_BASE_URL=http://localhost:8001` in `wenxin-moyun/.env`

### Backend Startup Issues

- **uvicorn command not found**: Use `python -m uvicorn` instead of `uvicorn` directly
- **Database encoding errors**: Character encoding issues in init_db.py output can be ignored
- **Port 8001 in use**: Kill existing process with `taskkill /F /IM python.exe` (Windows) or change port
- **bcrypt version warning**: "(trapped) error reading bcrypt version" can be safely ignored

### API Integration Issues

- **CORS errors**: Backend must be running on port 8001, frontend on 5173
- **Models not loading**: Check if backend is running and `/api/v1/models/` returns data
- **Fallback to mock data**: This is expected behavior when API is unavailable

## Important Notes

### Current Development State

- **Simplified Setup**: Project configured to run without Docker, Redis, or PostgreSQL
- **Sample Data**: 10 AI models pre-configured in `init_db.py` including GPT-4, Claude, Qwen, etc.
- **Automatic Fallback**: Frontend gracefully handles API failures by loading mock data
- **Encoding Issues**: Chinese characters may show encoding errors in terminal but work correctly in the app