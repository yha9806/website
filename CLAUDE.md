# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **15 organizations**. Full-stack application featuring complete iOS design system, real AI model benchmarking with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

### Production Access
- **Frontend**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/ (HashRouter, use # for routes)
- **Backend API**: https://wenxin-moyun-api-229980166599.asia-east1.run.app
- **API Docs**: https://wenxin-moyun-api-229980166599.asia-east1.run.app/docs

## 🔴 Critical: Environment Consistency Requirements

### Python Version Requirements
- **Production**: Python 3.13-slim (Docker image)
- **Development**: Must use Python 3.13.x
- **GitHub Actions**: Supports Python 3.13
- **Reason**: Package compatibility and consistent behavior

### Package Version Management
All dependencies MUST be synchronized between development and production:

```bash
# Development installation (ALWAYS use constraints)
cd wenxin-backend
pip install -r requirements.txt -c constraints.txt

# Production uses requirements.prod.txt (subset of requirements.txt)
# Both files MUST have identical versions for shared packages
```

### Current Dependency Versions (MUST maintain)
```txt
# Core dependencies - DO NOT change without testing in Docker
fastapi==0.116.1
uvicorn[standard]==0.35.0
pydantic==2.11.7
pydantic-settings==2.10.1
sqlalchemy==2.0.43
alembic==1.16.4
openai==1.99.9
anthropic==0.64.0
```

### Docker Requirements
Production Dockerfile (`wenxin-backend/Dockerfile.cloud`) critical settings:
- Base image: `python:3.13-slim`
- System dependencies: `gcc g++ libpq-dev` (required for psycopg2-binary)
- Port: Use `${PORT:-8080}` environment variable, NOT hardcoded
- Host: Must be `0.0.0.0`, NOT `localhost` or `127.0.0.1`

### Environment Variable Requirements
```bash
# Production (set by Cloud Run)
PORT=8080                    # Dynamic, use ${PORT} in CMD
PYTHONUNBUFFERED=1          # Required for Cloud Run logging
DATABASE_URL=postgresql+asyncpg://...  # Cloud SQL connection
ENVIRONMENT=production

# Development
PORT=8001                    # Local backend port
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
ENVIRONMENT=development
```

## Essential Commands

### Quick Start (One-click Setup)
```bash
# Windows
start.bat              # Initializes DB, starts backend (:8001) + frontend (:5173)

# Linux/macOS
./start.sh             # Same as above for Unix systems
```

### Frontend Development (wenxin-moyun/)
```bash
npm install --legacy-peer-deps  # Initial setup (required for React 19)
npm run dev            # Start dev server (port 5173+)
npm run build          # TypeScript check + production build
npm run build:prod     # Production build with env vars
npm run lint           # ESLint validation
npm run preview        # Preview production build

# E2E Testing (Playwright - 64 test cases)
npm run test:e2e       # Run all tests headless
npm run test:e2e:ui    # Interactive UI mode for debugging
npm run test:e2e:debug # Step-by-step debugging mode
npm run test:e2e:headed # Run tests in visible browser
npm run test:e2e:report # Show HTML test report
npm run test:e2e -- tests/e2e/specs/auth-fixed.spec.ts  # Run specific test file
npx playwright test --config=tests/e2e/playwright.ci.config.ts  # CI-specific config
```

### Backend Development (wenxin-backend/)
```bash
# Environment Setup (CRITICAL: Match production versions)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt -c constraints.txt     # ALWAYS use constraints

# Development Server
python -m uvicorn app.main:app --reload --port 8001   # Start API server

# Database Operations
python init_db.py                                     # Reset database with AI models
python add_test_users.py                              # Add test users (demo, admin, test)

# Testing
pytest                 # Run all tests
pytest tests/test_auth.py -v  # Run specific test verbose
pytest -k "test_login" -v     # Run tests matching pattern
pytest --cov=app tests/       # Test coverage

# AI Model Testing
python test_unified_interface.py  # Verify models use correct APIs
python openai_benchmark.py        # Run real AI benchmarks

# Database Migrations (Alembic)
alembic upgrade head              # Apply all migrations
alembic revision --autogenerate -m "Description"  # Create new migration
alembic downgrade -1              # Rollback one migration
```

### Database Operations
```bash
# Development (SQLite)
cd wenxin-backend
rm wenxin.db           # Delete existing database (Windows: del wenxin.db)
python init_db.py      # Recreate with schema + 42 AI models
python add_test_users.py  # Add test users (demo/demo123, admin/admin123, test/test123)

# Check model rankings
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST'); print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]]); conn.close()"

# Check users
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT username FROM users'); print('Users:', cursor.fetchall()); conn.close()"
```

### GitHub Actions & Deployment
```bash
# Check deployment status
gh run list --workflow=deploy-gcp.yml --limit=5
gh run view <run_id> --log

# View specific job logs for debugging
gh run view <run_id> --log | grep -A 10 -B 10 "error"
gh run view <run_id> --job <job_id> --log

# Download artifacts from failed runs
gh run download <run_id>

# Create and manage PRs
gh pr create --title "Title" --body "Description"
gh pr merge --squash

# Manual deployment trigger
gh workflow run deploy-gcp.yml

# Production debugging
gcloud run services describe wenxin-moyun-api --region=asia-east1
gcloud run services logs read wenxin-moyun-api --region=asia-east1 --limit=50
gcloud logging read "resource.type=cloud_run_revision" --limit=20 --format=json
```

### Testing Production Compatibility Locally
```bash
# Build and test Docker image locally
cd wenxin-backend
docker build -f Dockerfile.cloud -t wenxin-test .
docker run -p 8080:8080 -e PORT=8080 wenxin-test

# Verify versions match
pip freeze > current_versions.txt
diff requirements.prod.txt current_versions.txt
```

## High-Level Architecture

### System Architecture
```
Frontend (React 19 + iOS Design)  ←→  Backend (FastAPI + SQLAlchemy)  ←→  AI Providers (8 providers)
        ↓                                       ↓                              ↓
  iOS Components                         Unified Model Interface          Model Adapters
  Zustand State                          Evaluation Engine                Provider-specific APIs
  Playwright Tests                       Real-time WebSockets             Intelligent Scoring
        ↓                                       ↓                              ↓
  Cloud Storage (Static)  ←→  Cloud Run (Backend API)  ←→  Secret Manager (API Keys)
                                        ↓
                              Cloud SQL (PostgreSQL)
```

### Critical System Components

#### Routing Configuration (Important)
**Frontend uses HashRouter**: Due to Cloud Storage static hosting limitations, all routes use hash-based navigation:
- Homepage: `#/`
- Leaderboard: `#/leaderboard`
- Battle: `#/battle`
- Model Detail: `#/model/:id`
- Login: `#/login`

Configuration in `src/App.tsx` uses `HashRouter` instead of `BrowserRouter`.

**E2E Test Compatibility**: Tests use route helpers in `tests/e2e/utils/route-helper.ts` to handle HashRouter URLs:
```typescript
const withRoute = (path: string): string => {
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};
```

#### Unified Model Interface (Core AI Integration)
**Location**: `wenxin-backend/app/services/models/`

**Key Files:**
- `unified_client.py` - Central interface for all AI models with special parameter handling
- `model_registry.py` - Registry managing 42 AI models from 15 organizations
- `adapters/` - Provider-specific adapters (OpenAI, Anthropic, Google, etc.)

**Critical Pattern**: Models have different API requirements:
```python
# GPT-5 series require max_completion_tokens (not max_tokens)
response = await client.generate(
    model_id="gpt-5",
    prompt="Write a poem",
    max_completion_tokens=500  # NOT max_tokens
)

# o1 series don't support temperature parameter
response = await client.generate(
    model_id="o1-mini", 
    prompt="Solve this problem",
    # temperature automatically removed for o1 models
)
```

#### iOS Design System (Frontend)
**Location**: `wenxin-moyun/src/components/ios/`

**Core Components:**
- `IOSButton`, `IOSCard`, `IOSToggle`, `IOSSlider`, `IOSAlert`
- 60+ Fluent Emoji SVGs with semantic categorization
- Theme system with iOS colors (#007AFF, #34C759, #FF9500, #FF3B30)
- Glass morphism effects and San Francisco font stack

#### Database Models & NULL Handling Pattern
**Critical Business Rule**: Image models have NULL `overall_score` (intentional)
```typescript
// Frontend - Always check for null scores
{score != null ? score.toFixed(1) : 'N/A'}

// Sorting with NULL handling
.sort((a, b) => {
  if (a.overall_score == null && b.overall_score == null) return 0;
  if (a.overall_score == null) return 1;  // NULL scores go to end
  if (b.overall_score == null) return -1;
  return b.overall_score - a.overall_score;
})
```

#### Authentication System
**Backend**: FastAPI OAuth2 with JWT tokens
- Login endpoint requires `application/x-www-form-urlencoded` format (not JSON)
- Test users: demo/demo123, admin/admin123, test/test123

**Frontend**: Token stored in localStorage
```typescript
// Login request (form-urlencoded)
const formParams = new URLSearchParams();
formParams.append('username', username);
formParams.append('password', password);

await apiClient.post('/auth/login', formParams, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

## Testing Architecture

### E2E Testing (Playwright)
**Configuration**: 
- Local: `tests/e2e/playwright.config.ts` (dual-server setup)
- CI: `tests/e2e/playwright.ci.config.ts` (optimized for CI stability)

**Test Files**:
- `auth-fixed.spec.ts` - Fixed authentication tests with HashRouter support
- `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering
- `basic-navigation.spec.ts` - Basic navigation and health checks
- `homepage.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features

**Page Objects Pattern**: Tests use page objects in `tests/e2e/pages/` for maintainability:
```typescript
// HomePage doesn't have login button - navigate directly to login
async navigateToLogin() {
  await this.navigateTo('/login');
}
```

## Deployment

### Automated Deployment (GitHub Actions)
**Workflow**: `.github/workflows/deploy-gcp.yml`
**Triggers**: Every push to main/master branch
**Process**: Test → Build Docker → Push to Artifact Registry → Deploy to Cloud Run → Update Static Files

### Manual Deployment
```bash
# Backend Deployment
docker build -f wenxin-backend/Dockerfile.cloud -t asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest wenxin-backend/
docker push asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest
gcloud run deploy wenxin-moyun-api --image=asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest --region=asia-east1

# Frontend Deployment  
cd wenxin-moyun && npm run build
gsutil -m rsync -r -d dist/ gs://wenxin-moyun-prod-new-static/
```

## Critical Production Lessons

### Database Migration Strategy (CRITICAL)
**Understanding `alembic stamp` vs `alembic upgrade`**:
- `stamp`: Only updates version table, doesn't execute SQL (common mistake!)
- `upgrade`: Actually runs migration SQL to modify schema

**Production Migration with Cloud Run Jobs** (Best Practice 2024-2025):
```yaml
# Use Cloud Run Jobs for migrations, not inline with deployment
gcloud run jobs create wenxin-migrate-$SHORT_SHA \
  --image=$IMAGE \
  --command="python" \
  --args="migrate.py" \
  --set-cloudsql-instances=$INSTANCE
```

**Migration Script Pattern** (`wenxin-backend/migrate.py`):
```python
def force_schema_sync():
    # 1. Try Alembic migration first
    if force_alembic_migration():
        return True
    
    # 2. Fallback to direct column fix
    if direct_column_fix():
        subprocess.run(['alembic', 'stamp', 'head'])
        return True
    
    # 3. Full reset as last resort
    subprocess.run(['alembic', 'stamp', 'base'])
    subprocess.run(['alembic', 'upgrade', 'head'])
```

**Repair Migration Pattern** (`alembic/versions/fix_missing_columns.py`):
```python
def upgrade():
    # Check existing columns first
    inspector = sa.inspect(bind)
    existing_columns = [col['name'] for col in inspector.get_columns('ai_models')]
    
    # Add only missing columns
    for col_name, col_type in required_columns:
        if col_name not in existing_columns:
            op.add_column('ai_models', sa.Column(col_name, col_type))
```

## Common Issues & Solutions

### Version Mismatch Issues
- **Issue**: Production deployment fails due to package version differences
- **Solution**: 
  1. Always use exact versions in requirements.txt and requirements.prod.txt
  2. Test locally with Docker before deployment: `docker build -f Dockerfile.cloud .`
  3. Keep Python version consistent (3.13) between dev and prod

### E2E Test Failures
- **Issue**: Tests timeout looking for login button on homepage
- **Solution**: HomePage doesn't have login button; tests navigate directly to `/login`
- **Fix**: Update page objects to match actual UI structure

### Authentication Failures (401)
- **Issue**: Login returns 401 Unauthorized
- **Solution**: Ensure test users exist in database - run `python add_test_users.py`
- **Note**: Backend expects form-urlencoded data, not JSON

### HashRouter URL Issues
- **Issue**: Direct URL access shows 404 or tests fail with wrong URLs
- **Solution**: All routes must use hash format (`#/path`)
- **Testing**: Use route helpers in `tests/e2e/utils/route-helper.ts`

### Docker Build Failures
- **Issue**: `pg_config executable not found` when building Docker image
- **Solution**: Ensure `libpq-dev` is installed in Dockerfile for psycopg2-binary
- **Fix**: Already included in current Dockerfile.cloud

### Cloud Run Container Startup Issues (CRITICAL)
- **Issue**: "Container failed to start and listen on PORT=8080"
- **Root Causes & Solutions**:
  1. **PORT Hardcoding**: Must use `${PORT:-8080}` environment variable
     ```dockerfile
     # ✅ CORRECT
     CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
     
     # ❌ WRONG - Will fail in Cloud Run
     CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
     ```
  2. **Host Binding**: Must use `0.0.0.0`, not `localhost` or `127.0.0.1`
  3. **Logging**: Add `PYTHONUNBUFFERED=1` for immediate log output

### PostgreSQL Column Missing Errors
- **Issue**: "column ai_models.rhythm_score does not exist" despite "successful" migration
- **Root Cause**: Used `alembic stamp` instead of `alembic upgrade`
- **Solutions**:
  1. **Repair Migration**: Create fix_missing_columns.py that checks existing columns
  2. **Force Re-execution**: Downgrade then upgrade
  3. **Direct Fix + Stamp**: Add columns directly then update Alembic version

### Python 3.13 Compatibility Issues
- **Issue**: psycopg2-binary compilation errors with `_PyInterpreterState_Get()`
- **Solution**: Upgrade to psycopg2-binary==2.9.10 or later (2.9.9 incompatible)
- **Dockerfile Requirements**:
  ```dockerfile
  FROM python:3.13-slim
  RUN apt-get update && apt-get install -y gcc g++ libpq-dev
  ```

### bcrypt Dependency Conflicts
- **Issue**: `AttributeError: module 'bcrypt' has no attribute '__about__'`
- **Solution**: Use constraints.txt with `bcrypt==4.3.0`
- **Install**: `pip install -r requirements.txt -c constraints.txt`

### Frontend Build Issues
- **Issue**: npm install fails with peer dependency conflicts
- **Solution**: Use `npm install --legacy-peer-deps` (required for React 19)

### Windows Path Issues
- **Issue**: Playwright config fails to find backend on Windows
- **Solution**: Use platform-specific paths in playwright.config.ts:
```typescript
command: process.platform === 'win32' 
  ? 'cd ..\\wenxin-backend && python -m uvicorn app.main:app --port 8001'
  : 'cd ../wenxin-backend && python -m uvicorn app.main:app --port 8001'
```

## Google Cloud Platform Configuration

### Project Setup
- **Project ID**: `wenxin-moyun-prod-new`
- **Region**: `asia-east1`
- **Service Account**: `github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com`

### Required Secrets (GitHub Repository Settings)
- `GCP_SA_KEY` - Service account JSON
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `GEMINI_API_KEY` - Google Gemini API (optional)

### GCP Services Used
- Cloud Run (Backend API)
- Cloud Storage (Frontend static hosting)
- Cloud SQL (PostgreSQL database)
- Secret Manager (API keys)
- Artifact Registry (Docker images)

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`
- Test: `test` / `test123`

## Production Deployment Troubleshooting Checklist

### When Cloud Run Deployment Fails
1. **Check container startup**:
   - Verify PORT environment variable usage: `${PORT:-8080}`
   - Confirm host binding: `0.0.0.0` not `localhost`
   - Check Python version compatibility (3.13)

2. **Verify package versions**:
   ```bash
   # Compare local vs production
   pip freeze > local_versions.txt
   diff requirements.prod.txt local_versions.txt
   
   # Test Docker build locally
   docker build -f wenxin-backend/Dockerfile.cloud -t test .
   docker run -e PORT=8080 -p 8080:8080 test
   ```

3. **Database migration issues**:
   - Check if using `alembic upgrade` not `alembic stamp`
   - Verify Cloud SQL connection string format
   - Run migrations via Cloud Run Jobs, not inline

4. **Check logs**:
   ```bash
   # GitHub Actions logs
   gh run view <run_id> --log | grep -i error
   
   # Cloud Run logs
   gcloud run services logs read wenxin-moyun-api --region=asia-east1 --limit=100
   
   # Cloud SQL logs
   gcloud sql operations list --instance=wenxin-postgres
   ```

5. **Common fixes**:
   - psycopg2-binary >= 2.9.10 for Python 3.13
   - bcrypt == 4.3.0 in constraints.txt
   - libpq-dev in Dockerfile for PostgreSQL support