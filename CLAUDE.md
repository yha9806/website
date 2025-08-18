# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **13 organizations**. Full-stack application featuring iOS design system, real AI model benchmarking with Unified Model Interface, comprehensive E2E testing, and production Google Cloud Platform deployment.

### Production Access
- **Frontend**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/ (HashRouter required)
- **Backend API**: https://wenxin-moyun-api-229980166599.asia-east1.run.app
- **API Docs**: https://wenxin-moyun-api-229980166599.asia-east1.run.app/docs

## Essential Commands

### Quick Start
```bash
# Windows
start.bat              # Initializes DB, starts backend (:8001) + frontend (:5173)

# Linux/macOS
./start.sh             # Same as above for Unix systems
```

### Frontend Development (wenxin-moyun/)
```bash
npm install --legacy-peer-deps  # Required for React 19 compatibility
npm run dev            # Start dev server (port 5173+)
npm run build          # TypeScript check + production build
npm run build:prod     # Production build with env vars
npm run lint           # ESLint validation

# E2E Testing (Playwright)
npm run test:e2e       # Run all tests headless
npm run test:e2e:ui    # Interactive UI mode
npm run test:e2e:debug # Step-by-step debugging
npm run test:e2e -- tests/e2e/specs/auth-fixed.spec.ts  # Run specific test
```

### Backend Development (wenxin-backend/)
```bash
pip install -r requirements.txt -c constraints.txt  # Use constraints for bcrypt compatibility
python -m uvicorn app.main:app --reload --port 8001

# Database Management
python init_db.py              # Initialize with 42 AI models
python create_admin_user.py    # Create admin user (admin/admin123)
python add_test_users.py       # Add test users

# Database Migrations (Alembic)
alembic upgrade head           # Apply migrations
alembic revision --autogenerate -m "Description"  # Create new migration

# Score Management
python update_scores_async.py --login admin admin123  # Get auth token
python update_scores_async.py --token <token> --model <uuid> --overall 95.0
python update_scores_async.py --token <token> --batch example_score_updates.json

# Testing
pytest                         # Run all tests
pytest tests/test_auth.py -v   # Run specific test
pytest --cov=app tests/        # Test coverage
```

### Deployment
```bash
# GitHub Actions (auto-deploys on push to main)
gh run list --workflow=deploy-gcp.yml --limit=5
gh workflow run deploy-gcp.yml  # Manual trigger

# Manual Docker Deployment
docker build -f wenxin-backend/Dockerfile.cloud -t asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest wenxin-backend/
docker push asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest
gcloud run deploy wenxin-moyun-api --image=asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest --region=asia-east1
```

## High-Level Architecture

### System Components
```
Frontend (React 19 + iOS Design)  ←→  Backend (FastAPI + SQLAlchemy)  ←→  AI Providers
        ↓                                       ↓                              ↓
  iOS Components                         Unified Model Interface          Model Adapters
  Zustand State                          Repository Pattern               Provider APIs
  HashRouter                             Alembic Migrations              Score Management
        ↓                                       ↓                              ↓
  Cloud Storage (Static)  ←→  Cloud Run (Backend API)  ←→  Secret Manager (API Keys)
                                        ↓
                              Cloud SQL (PostgreSQL)
```

### Critical Architecture Patterns

#### 1. HashRouter Navigation (Frontend)
All routes MUST use hash format (`#/path`) due to Cloud Storage static hosting:
```typescript
// src/App.tsx uses HashRouter
<HashRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/model/:id" element={<ModelDetail />} />
  </Routes>
</HashRouter>

// E2E tests use helper in tests/e2e/utils/route-helper.ts
const withRoute = (path: string): string => {
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};
```

#### 2. Database Architecture (Backend)
**Dual-format score storage for compatibility:**
```python
# app/models/ai_model.py
class AIModel(Base):
    # Individual score columns (for PostgreSQL compatibility)
    rhythm_score = Column(Float)
    composition_score = Column(Float)
    # ... other scores
    
    # JSON metrics (backward compatibility)
    metrics = Column(JSON)
```

**Repository Pattern for data access:**
```python
# app/repositories/model_repository.py
class ModelRepository:
    def _normalize_model(self, model: AIModel) -> AIModel:
        # Ensures both formats are populated
```

#### 3. Authentication System
**Admin-only operations require JWT token:**
```python
# app/core/auth.py
async def get_current_admin_user(...) -> User:
    # Validates admin role
    if not user.is_superuser:
        raise HTTPException(status_code=403)
```

**OAuth2 login requires form-encoded data:**
```python
# NOT JSON - must be form data
data = aiohttp.FormData()
data.add_field('username', username)
data.add_field('password', password)
```

#### 4. Unified Model Interface
**Location**: `wenxin-backend/app/services/models/`

**Special parameter handling for different models:**
```python
# GPT-5 series require max_completion_tokens
response = await client.generate(
    model_id="gpt-5",
    max_completion_tokens=500  # NOT max_tokens
)

# o1 series don't support temperature
response = await client.generate(
    model_id="o1-mini",
    # temperature automatically removed
)
```

#### 5. NULL Score Handling
**Image models intentionally have NULL overall_score:**
```typescript
// Always check for null
{score != null ? score.toFixed(1) : 'N/A'}

// Sort with NULLS LAST
.sort((a, b) => {
  if (a.overall_score == null) return 1;
  if (b.overall_score == null) return -1;
  return b.overall_score - a.overall_score;
})
```

## Database Management

### Migrations (Alembic)
- Migrations auto-run on Docker startup
- Support both SQLite (dev) and PostgreSQL (prod)
- Location: `wenxin-backend/alembic/versions/`

### Seed Data
- 42 AI models from 13 organizations
- Location: `wenxin-backend/app/core/seed_data.py`
- Auto-loads when database is empty

### Score Updates
Use admin API endpoints or CLI tools:
- `PUT /api/v1/admin/models/{id}/scores` - Update single model
- `POST /api/v1/admin/models/batch-update-scores` - Batch update
- `POST /api/v1/admin/models/reset-to-seed` - Reset to defaults

## Common Issues & Solutions

### Frontend Issues
- **npm install fails**: Use `npm install --legacy-peer-deps` for React 19
- **404 on direct URLs**: All routes must use hash format (`#/path`)
- **Login button missing on homepage**: Navigate directly to `#/login`

### Backend Issues
- **bcrypt error**: Use `pip install -r requirements.txt -c constraints.txt`
- **500 errors on production**: Check database columns with health endpoint
- **Auth failures**: Ensure form-urlencoded format for login

### Testing Issues
- **E2E tests fail on Windows**: Check path separators in playwright.config.ts
- **Tests timeout**: HomePage navigates directly to login, no button
- **HashRouter URLs**: Use route helpers for correct URL format

## GCP Configuration

### Project Details
- **Project ID**: `wenxin-moyun-prod-new`
- **Region**: `asia-east1`
- **Services**: Cloud Run, Cloud Storage, Cloud SQL, Secret Manager

### GitHub Secrets Required
- `GCP_SA_KEY` - Service account JSON
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access

### Test Accounts
- **Admin**: `admin` / `admin123` (full access)
- **Demo**: `demo` / `demo123` (read-only)
- **Test**: `test` / `test123` (for testing)