# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **15 organizations**. Full-stack application featuring complete iOS design system, real AI model benchmarking with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

### Production Access
- **Frontend**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/ (HashRouter, use # for routes)
- **Backend API**: https://wenxin-moyun-api-229980166599.asia-east1.run.app
- **API Docs**: https://wenxin-moyun-api-229980166599.asia-east1.run.app/docs

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
pip install -r requirements.txt -c constraints.txt     # Install with version constraints
python -m uvicorn app.main:app --reload --port 8001   # Start API server
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

# Create and manage PRs
gh pr create --title "Title" --body "Description"
gh pr merge --squash

# Manual deployment trigger
gh workflow run deploy-gcp.yml
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

## Common Issues & Solutions

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

### bcrypt Dependency Conflicts
- **Issue**: `AttributeError: module 'bcrypt' has no attribute '__about__'`
- **Solution**: Use constraints.txt with `bcrypt==4.0.1`
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