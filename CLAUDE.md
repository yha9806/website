# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **15 organizations**. Features complete iOS design system migration (2025-08-11), real benchmark testing with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

**Architecture**:
- **Frontend**: React 19 + TypeScript 5.8 + Vite 7.1 with pure iOS design system
- **Backend**: FastAPI + SQLAlchemy with async evaluation engine and intelligent scoring
- **Database**: SQLite (dev) / PostgreSQL (production) with proper foreign key constraints and NULL score handling
- **Real-time**: WebSocket for live battle updates and progress tracking  
- **AI Integration**: Unified Model Interface with provider adapters ensuring correct model routing
- **Testing**: Playwright E2E framework with 64 test cases across multiple browsers
- **Deployment**: Complete Google Cloud Platform infrastructure with automated CI/CD pipeline

## Environment Requirements ⚙️

### Required Versions (GitHub Actions Standard)
- **Node.js**: 20.19.4 (use `nvm install 20.19.4 && nvm use 20.19.4`)
- **npm**: ≥10.0.0 (use `npm install -g npm@latest`)
- **Python**: 3.10+ (check with `python --version`)

### Environment Setup Verification
```bash
# 1. Install correct Node.js version
nvm install 20.19.4
nvm use 20.19.4

# 2. Verify environment consistency with CI
cd wenxin-moyun && npm run validate-env

# 3. Install dependencies with correct npm configuration
npm install  # Uses .npmrc settings (legacy-peer-deps=true)

# 4. Install Playwright browsers
npx playwright install
```

### Version Lock Files
The project includes version lock files to ensure consistency:
- `.nvmrc` - Node.js version (20.19.4)
- `.python-version` - Python version (3.10)
- `.npmrc` - npm configuration (legacy-peer-deps=true)
- `package.json` engines field - Node.js/npm requirements

## Essential Commands

### Quick Start (Development)
```bash
# Windows one-click startup (initializes DB, starts backend on :8001, frontend on :5173)
start.bat

# Manual startup (separate terminals):
cd wenxin-backend && python init_db.py                # Initialize database (first time only)
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev                        # Frontend (auto-increments from port 5173)
```

### Production Deployment (Google Cloud Platform)

#### Complete GCP Setup
```bash
# Automated setup (recommended)
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh

# Manual GCP project setup
export PROJECT_ID="wenxin-moyun-prod"
export REGION="asia-east1"
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

#### Infrastructure Creation
```bash
# Create Artifact Registry
gcloud artifacts repositories create wenxin-images \
  --repository-format=docker \
  --location=$REGION

# Create Cloud SQL PostgreSQL instance
gcloud sql instances create wenxin-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=20GB \
  --backup-start-time=02:00

# Create database and user
gcloud sql databases create wenxin_db --instance=wenxin-postgres
gcloud sql users create wenxin --instance=wenxin-postgres --password=SECURE_PASSWORD

# Create Cloud Storage buckets
gsutil mb -l $REGION gs://$PROJECT_ID-static
gsutil mb -l $REGION gs://$PROJECT_ID-backups
```

#### Secrets Management
```bash
# Store API keys and secrets in Secret Manager
gcloud secrets create db-password --data-file=<(echo "your-secure-db-password")
gcloud secrets create secret-key --data-file=<(echo "your-secret-key-here")
gcloud secrets create openai-api-key --data-file=<(echo "your-openai-api-key")
gcloud secrets create anthropic-api-key --data-file=<(echo "your-anthropic-api-key")
gcloud secrets create gemini-api-key --data-file=<(echo "your-gemini-api-key")
```

#### Manual Deployment
```bash
# Backend deployment
docker build -f wenxin-backend/Dockerfile.cloud \
  -t asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest \
  wenxin-backend/
docker push asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest

gcloud run deploy wenxin-moyun-api \
  --image=asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-cloudsql-instances=$PROJECT_ID:$REGION:wenxin-postgres \
  --update-secrets="OPENAI_API_KEY=openai-api-key:latest"

# Frontend deployment
cd wenxin-moyun
export VITE_API_BASE_URL=$(gcloud run services describe wenxin-moyun-api --region=$REGION --format="value(status.url)")
npm run build
gsutil -m rsync -r -d dist/ gs://$PROJECT_ID-static/
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-static
```

### Frontend Development (wenxin-moyun)
```bash
npm install                   # Install dependencies
npm run dev                   # Start dev server (port 5173+)
npm run build                 # TypeScript check + production build
npm run lint                  # ESLint validation
npm run preview               # Preview production build

# E2E Testing (Playwright - 64 test cases)
npm run test:e2e              # Run tests headless across all browsers
npm run test:e2e:ui           # Interactive UI mode for debugging
npm run test:e2e:debug        # Step-by-step debugging mode
npm run test:e2e:headed       # Run tests in visible browser
npm run test:e2e:report       # Show HTML test report
npm run test:e2e -- --grep="specific test"  # Run specific test pattern
```

### Backend Development (wenxin-backend)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data

# Testing
pytest                        # Run all tests
pytest tests/test_auth.py -v  # Run specific test verbose
pytest -k "test_login" -v     # Run tests matching pattern
pytest --cov=app tests/       # Test coverage

# Benchmark Testing
curl -X POST "http://localhost:8001/api/v1/benchmarks/run" \
  -H "Content-Type: application/json" \
  -d '{"suite_id": "SUITE_ID", "model_id": "MODEL_ID"}'

# Test Unified Model Interface
python test_unified_interface.py  # Verify models use correct APIs
```

### Database Operations
```bash
# Development (SQLite)
cd wenxin-backend
rm wenxin.db                  # Delete existing database (Windows: del wenxin.db)
python init_db.py             # Recreate with schema + sample data

# Production (PostgreSQL via Cloud SQL)
gcloud sql connect wenxin-postgres --user=wenxin
python scripts/migrate-to-cloud-sql.py  # Migration script

# Check model rankings
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST'); print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]]); conn.close()"
```

## Architecture Overview

### Core System Flow
```
Frontend (React 19)          Backend (FastAPI)         Services Layer           Database (SQLite/PostgreSQL)
    ↓                           ↓                         ↓                        ↓
iOS Components              API v1 Routers         Unified Model Interface    Core Tables
    ↓                           ↓                         ↓                    - users
Custom Hooks               Async Handlers         Model Registry             - ai_models (42 models)
    ↓                           ↓                         ↓                    - battles  
Axios Client ──────→      Service Layer ───→    Provider Adapters          - evaluation_tasks
                                                         ↓                    - artworks
                                                   BenchmarkRunner           
                                                         ↓                 Benchmark Tables
                                                 Intelligent Scoring        - benchmark_suites
                                                                           - benchmark_runs
```

### Production Cloud Architecture
```
Internet → Cloud CDN → Cloud Storage (Frontend)
                    ↘
                     Cloud Run (Backend API) ← Artifact Registry
                             ↓
                     Cloud SQL (PostgreSQL)
                             ↓
                     Secret Manager (API Keys)
                             ↓
                     Cloud Monitoring & Logging
```

### Data Pipeline: Evaluation to Gallery
1. User creates evaluation task (Frontend) → Backend saves with parameters
2. Background processing via `evaluation_engine.py` → AI provider generates content
3. Intelligent scoring calculates metrics → Artwork automatically created
4. Gallery displays generated artworks with proper NULL score handling

## Critical System Components

### Unified Model Interface (Fixed Model Routing Bug)
- **app/services/models/unified_client.py** - Central interface for all AI models with special parameter handling
- **app/services/models/model_registry.py** - Registry managing 42 AI models from 15 organizations  
- **app/services/models/adapters/** - Provider-specific adapters (OpenAI, Anthropic, Google, etc.)
- **Fixed Issue**: Previous system hardcoded gpt-4o-mini for all models; now correctly routes to designated APIs
- **Special Handling**: GPT-5 series require `max_completion_tokens`, o1 series don't support temperature

### Frontend Architecture (React 19 + iOS Design)
- **src/components/ios/** - Complete iOS design system (IOSButton, IOSCard, IOSToggle, etc.)
- **src/hooks/useLeaderboard.ts** - Handles NULL score sorting and display
- **src/services/api.ts** - Axios client with guest sessions and caching
- **src/pages/** - Route-level pages with iOS styling

### Backend Services
- **app/services/evaluation_engine.py** - Async evaluation pipeline orchestration
- **app/services/benchmark/benchmark_runner.py** - Real AI model benchmark execution
- **app/services/intelligent_scoring/ai_scorer.py** - GPT-4o-mini based scoring with fallbacks
- **app/api/v1/battles.py** - Battle system with WebSocket real-time updates

### Database Models & NULL Handling
- **app/models/ai_model.py** - Enhanced model with `model_type` separation and nullable scores
- **Critical Pattern**: Image models have NULL `overall_score` - this is intentional
- **Frontend Pattern**: Always check `{score != null ? score.toFixed(1) : 'N/A'}`

### Google Cloud Infrastructure
- **Cloud Run**: Auto-scaling backend API (0-10 instances, 2GB memory, 1 vCPU)
- **Cloud SQL**: PostgreSQL 15 with automated backups and point-in-time recovery
- **Cloud Storage**: Static frontend hosting with CDN and backup storage
- **Secret Manager**: Secure API key storage for 8 AI providers
- **Artifact Registry**: Docker image storage for containerized deployments
- **Cloud Monitoring**: Full observability with alerts and dashboards

## API Architecture

### Core Endpoints
- `GET /api/v1/models/` - AI model metadata with NULL-safe score handling
- `POST /api/v1/evaluations/` - Create evaluation task with language parameter
- `GET /api/v1/battles/random` - Get random active battle for voting
- `POST /api/v1/benchmarks/run` - Execute real AI model benchmarks
- `GET /health` - Health check endpoint for production monitoring

### Real-time Features
- **WebSocket**: `/api/v1/ws/battle` - Live battle vote updates
- **Battle System**: Real-time voting with foreign key validation
- **Guest Sessions**: UUID-based tracking with daily limits

## Development Patterns

### Model Type Separation (Critical)
```python
# Language Models - can be evaluated with text benchmarks
model_type = "llm"  # Has overall_score

# Image Models - cannot generate text, show N/A
model_type = "image"  # overall_score = NULL

# Multimodal - can handle both
model_type = "multimodal"  # Has overall_score
```

### NULL Score Handling
```typescript
// Frontend - Always check for null
{score != null ? score.toFixed(1) : 'N/A'}

// Sorting with NULL handling
.sort((a, b) => {
  if (a.overall_score == null && b.overall_score == null) return 0;
  if (a.overall_score == null) return 1;  // NULL scores go to end
  if (b.overall_score == null) return -1;
  return b.overall_score - a.overall_score;
})
```

### Using Unified Model Interface
```python
from app.services.models import UnifiedModelClient

client = UnifiedModelClient()
response = await client.generate(
    model_id="gpt-5",  # Correctly routes to GPT-5 API
    prompt="Write a poem about Spring",
    max_completion_tokens=500  # GPT-5 requires max_completion_tokens, not max_tokens
)

# o1 series example (no temperature support)
response = await client.generate(
    model_id="o1-mini",
    prompt="Solve this problem step by step",
    # temperature parameter automatically removed for o1 models
)
```

### iOS Design System Usage
```typescript
// iOS Components
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Leading Models" />
  <IOSCardContent>Content here</IOSCardContent>
  <IOSCardFooter>
    <IOSButton variant="primary">Action</IOSButton>
  </IOSCardFooter>
</IOSCard>

// Typography
<h1 className="text-large-title">WenXin MoYun</h1>
```

## CI/CD Automation (GitHub Actions)

### Complete Deployment Pipeline

The project includes automated deployment via GitHub Actions (`.github/workflows/deploy-gcp.yml`) that:

**On every push to main:**
1. **Test Phase**: Runs linting, building, backend tests, and E2E tests  
2. **Deploy Phase**: 
   - Builds and pushes Docker images to Artifact Registry
   - Runs database migrations via temporary Cloud Run job
   - Deploys backend to Cloud Run with auto-scaling configuration
   - Deploys frontend to Cloud Storage with public access
   - Runs health checks on both services
3. **Release Phase**: Generates deployment notes with commit history

**Key Features:**
- **Multi-environment**: Supports staging (PRs) and production (main branch)
- **Security**: Uses Workload Identity Federation for secure GCP authentication  
- **Error Handling**: Automatic rollback on health check failures
- **Monitoring**: Comprehensive logging and status reporting

### Required GitHub Secrets

Configure in GitHub repository → Settings → Secrets and Variables → Actions:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `GCP_SA_KEY` | Service account JSON key | `gcloud iam service-accounts keys create key.json --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com` |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | https://console.anthropic.com/ |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | https://ai.google.dev/ |

## Environment Configuration

### Development Environment

**Frontend (.env)**
```bash
VITE_API_BASE_URL=http://localhost:8001
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
```

**Backend (.env)**
```bash
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# AI Provider Keys (8 configured providers)
OPENAI_API_KEY=your-openai-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here  
QWEN_API_KEY=your-qwen-key-here
XAI_API_KEY=your-xai-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
GEMINI_API_KEY=your-gemini-key-here
HUGGINGFACE_API_KEY=your-huggingface-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### Production Environment (Google Cloud)

**Frontend Build Variables**
```bash
VITE_API_BASE_URL=https://wenxin-moyun-api-asia-east1.run.app
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

**Backend Cloud Run Environment**
```bash
DATABASE_URL=postgresql+asyncpg://wenxin:PASSWORD@/wenxin_db?host=/cloudsql/PROJECT:REGION:wenxin-postgres
SECRET_KEY=your-secret-key
DEBUG=false
ENVIRONMENT=production
```

**Secrets (stored in Secret Manager)**
- `db-password`: PostgreSQL database password
- `secret-key`: JWT signing key
- `openai-api-key`: OpenAI API key
- `anthropic-api-key`: Anthropic API key  
- `gemini-api-key`: Google Gemini API key

## GitHub Actions CI/CD Debugging Process

### Complete Debugging Workflow (2025-08-14)

Based on recent CI failures and successful resolution, here's the comprehensive debugging process for GitHub Actions failures:

#### 1. Initial Analysis Phase
```bash
# Access GitHub Actions logs via browser automation
# Use Playwright MCP to navigate to: https://github.com/[repo]/actions/runs/[run_id]/job/[job_id]

# Key locations to check:
- Job summary page for overall status
- Individual step logs (expand collapsed steps)  
- Annotations section for specific error messages
- Test artifacts (screenshots, videos, traces)
```

#### 2. Common Failure Patterns & Solutions

**A. Playwright Locator Syntax Errors**
```javascript
// ❌ WRONG: Mixing regex flags with CSS selectors
page.locator('text=/404|error/i, h1:has-text("404"), .error-page')

// ✅ CORRECT: Use .or() method to combine locators
page.locator('text=/404|error/i')
  .or(page.locator('h1:has-text("404")'))
  .or(page.locator('.error-page'))

// ❌ WRONG: Comma-separated selectors in single locator
page.locator('.btn-primary, .btn-secondary, button')

// ✅ CORRECT: Chain multiple locators with .or()
page.locator('.btn-primary')
  .or(page.locator('.btn-secondary'))
  .or(page.locator('button'))
```

**B. Node.js Version Mismatches**
```yaml
# ✅ CORRECT: Consistent Node.js version across all steps
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'  # Must match local development environment
```

**C. localStorage/sessionStorage CI Errors**
```typescript
// ✅ CORRECT: CI-safe storage access with error handling
if (process.env.CI) {
  // Skip localStorage operations in CI or use mocks
  return;
}

// Or use global setup to mock storage APIs
export class MockStorage implements Storage {
  private data: { [key: string]: string } = {};
  // Implement full Storage interface
}
```

**D. Pydantic v2 Migration Issues**
```python
# ❌ WRONG: Old Pydantic v1 syntax
class Config:
    from_attributes = True

# ✅ CORRECT: Pydantic v2 syntax
model_config = ConfigDict(from_attributes=True, protected_namespaces=())

# ❌ WRONG: Deprecated field parameters
regex="pattern", min_items=1

# ✅ CORRECT: Updated field parameters  
pattern="pattern", min_length=1
```

#### 3. Debugging Methodology

**Step 1: Log Analysis**
- Always start with job annotations (1 error indicator)
- Look for the FIRST error occurrence, not subsequent failures
- Check for syntax errors vs runtime errors vs timeout errors

**Step 2: Pattern Recognition**
```bash
# Search for common error patterns:
"SyntaxError: Invalid flags supplied to RegExp constructor"  → Playwright locator issue
"Process completed with exit code 1"                         → General failure, check specific step
"SecurityError: Failed to read the 'localStorage'"          → Storage access issue
"ConnectionError"                                            → Network/timeout issue
```

**Step 3: Systematic Verification**
```bash
# Check file-by-file for syntax issues:
npx tsc --noEmit tests/e2e/specs/*.ts  # TypeScript syntax check
npm run lint                           # ESLint validation
npm run test:e2e -- --dry-run          # Playwright syntax validation
```

#### 4. CI-Specific Configuration

**Playwright CI Configuration (`playwright.ci.config.ts`)**
```typescript
export default defineConfig({
  globalSetup: './global-setup.ts',    // CI environment setup
  fullyParallel: false,                // Stability over speed in CI
  retries: 2,                          // More retries for CI flakiness
  timeout: 45000,                      // Extended timeouts for CI environment
  workers: 1,                          // Single worker for stability
  webServer: {
    timeout: 180 * 1000,               // 3 minutes for server startup
    reuseExistingServer: false,        // Always fresh start in CI
  },
})
```

#### 5. Key Files for CI Debugging

**Critical Configuration Files:**
- `.github/workflows/deploy-gcp.yml` - Main workflow configuration
- `wenxin-moyun/tests/e2e/playwright.ci.config.ts` - CI-specific Playwright config
- `wenxin-moyun/tests/e2e/global-setup.ts` - CI environment initialization
- `wenxin-moyun/tests/e2e/utils/localStorage-mock.ts` - Storage API mocks

**Test Files Requiring Special Attention:**
- All E2E specs using `page.locator()` with multiple selectors
- Any tests accessing localStorage/sessionStorage
- Tests with complex async operations or timeouts

#### 6. Monitoring & Verification

**GitHub Actions Monitoring:**
```bash
# Monitor new runs after fixes
gh run list --limit 5
gh run watch [RUN_ID]

# Check specific job logs
gh run view [RUN_ID] --job [JOB_ID] --log
```

**Success Indicators:**
- ✅ All steps complete without red X marks
- ✅ E2E tests show "X passed" vs "X failed"  
- ✅ No annotation errors in job summary
- ✅ Deployment steps proceed (not skipped)

#### 7. Emergency Rollback Strategy

If CI remains broken after multiple attempts:
```bash
# Identify last working commit
git log --oneline -10

# Create rollback branch
git checkout -b rollback-ci-fix
git revert [COMMIT_HASH]
git push origin rollback-ci-fix

# Create emergency PR to restore stability
```

#### 8. Prevention Checklist

**Before Pushing E2E Test Changes:**
- [ ] Run `npm run test:e2e` locally (at least subset)
- [ ] Verify no comma-separated locator patterns
- [ ] Check Node.js version consistency
- [ ] Test storage access in CI-like environment
- [ ] Validate all regex patterns in locators

**Before Major Dependency Updates:**
- [ ] Check breaking changes in release notes
- [ ] Update configuration files accordingly
- [ ] Test in isolated environment first
- [ ] Prepare rollback strategy

## Testing & Quality Assurance

### E2E Testing (Playwright) - 64 Test Cases with Enhanced CI Compatibility

**Architecture:**
- **Configuration**: Unified `playwright.config.ts` based on CI environment standards
- **Browsers**: Chromium only (CI standard applied to local development)  
- **Storage Compatibility**: Enhanced storage mock system for CI/local consistency
- **Environment Parity**: Local environment matches GitHub Actions configuration exactly
- **Test Organization**: 64 tests in 9 spec files with page objects pattern

**Enhanced Storage System:**
- **Global Setup**: `global-setup.ts` with comprehensive storage API polyfills
- **Storage Mock**: `utils/storage-mock.ts` - SafeStorageAccessor for CI compatibility
- **Test Utils**: Enhanced `test-utils.ts` with unified storage access patterns
- **CI Safety**: Automatic fallback to window properties when storage APIs blocked

**Key Test Suites:**
- `homepage.spec.ts` - Homepage functionality and navigation
- `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering
- `ios-components.spec.ts` - iOS design system components
- `auth.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features
- `performance.spec.ts`, `visual.spec.ts` - Performance and visual regression

**Essential Test Commands:**
```bash
# Environment Verification (run before testing)
npm run validate-env          # Verify Node.js/Python versions match CI

# Development Testing (now uses CI-standard configuration)
npm run test:e2e              # Chromium only, CI timeouts, enhanced storage
npm run test:e2e:ui           # Interactive UI mode for debugging
npm run test:e2e:debug        # Step-by-step debugging mode
npm run test:e2e:headed       # Run tests in visible browser

# CI/CD Testing (identical to local config)
npm run test:e2e:ci           # Legacy CI config (same as npm run test:e2e)
npm run test:e2e:report       # Show HTML test report

# Targeted Testing
npm run test:e2e -- --grep="auth"         # Authentication tests only
npm run test:e2e -- --grep="battle"       # Battle tests only
npm run test:e2e -- --grep="evaluation"   # Evaluation tests only
```

**GitHub Actions Monitoring via VS Code:**
1. Install "GitHub Actions" VS Code extension
2. Monitor runs in real-time via extension sidebar
3. Access detailed logs without leaving IDE
4. Use commands: "View Run Logs", "Cancel Run", "Open Run in Browser"

### Critical CI/CD Debugging Patterns (2025-08-14 Experience)

**Common CI Failure Patterns & Solutions:**

**1. localStorage/sessionStorage SecurityError in CI (SOLVED)**
```typescript
// ❌ Problem: Direct storage access fails in headless CI
localStorage.setItem('auth_token', token);

// ✅ Solution: Enhanced SafeStorageAccessor system
import { safeStorage } from './utils/storage-mock';
// Automatically handles CI restrictions with memory fallback
safeStorage.setLocalItem('access_token', token);

// ✅ Alternative: Use enhanced test utilities
import { setAuthToken } from './helpers/test-utils';
await setAuthToken(page, token); // CI-safe with automatic storage detection
```

**2. Authentication Token Key Inconsistency**
```typescript
// ❌ Critical Bug: Store/retrieve key mismatch
localStorage.setItem('auth_token', token);      // Store as 'auth_token'
const token = localStorage.getItem('access_token'); // Retrieve as 'access_token'

// ✅ Solution: Use consistent key across all operations
localStorage.setItem('access_token', token);
const token = localStorage.getItem('access_token');
```

**3. Invalid Playwright Selector Syntax**
```typescript
// ❌ Invalid: Browser doesn't support pseudo-selectors
page.locator('select:has-option')

// ✅ Fixed: Simple selectors with fallbacks
page.locator('select, #model-select, .model-selector')
```

**4. Test Timeout Issues in CI Environment**
```typescript
// ✅ Increase timeouts for CI stability
test.describe('Battle System', () => {
  test.setTimeout(60000); // 60s for CI vs 30s default
});
```

**5. UI Element Dependencies**
```typescript
// ❌ Brittle: Depends on specific UI text that may change
await expect(page.locator('text=Welcome!')).toBeVisible();

// ✅ Robust: Check functional state instead
await expect(page).toHaveURL('/');
const token = await page.evaluate(() => localStorage.getItem('access_token'));
expect(token).toBeTruthy();
```

**Test Stability Best Practices:**
```typescript
// ✅ Flexible locators with multiple options
this.submitButton = page.locator([
  'button[type="submit"]',
  'button:has-text("Sign In")',
  '.ios-button:has-text("Login")'
].join(', '));

// ✅ Safe storage access pattern in test helpers
async setAuthToken(token: string) {
  await this.page.evaluate((token) => {
    try {
      if (localStorage) {
        localStorage.setItem('access_token', token);
      }
    } catch (e) {
      (window as any).__TEST_AUTH_TOKEN__ = token;
    }
  }, token);
}
```

### Known Issues & Solutions

**Port Conflicts**: Frontend auto-increments from 5173. Update Playwright config baseURL to match actual port.

**Foreign Key Constraints**: Battle system validates model relationships to prevent NULL reference errors.

**SVG Chart Rendering**: Fixed NaN coordinates by filtering NULL values before scale calculations.

**Model API Requirements**: 
- GPT-5 series require `max_completion_tokens` instead of `max_tokens` and reject temperature parameter
- o1 series need large token budgets and don't support temperature

**Windows Compatibility**: Use `del` instead of `rm`, `start.bat` for easy startup, check Windows Defender for port blocking.

**Playwright Testing**: 
- Test files must avoid reserved names like 'eval' in strict mode
- WebServer automatically starts dev server for tests
- VS Code integration available via `.vscode/settings.json`
- **CI Debugging**: Use VS Code GitHub Actions extension for real-time CI monitoring

## Production Deployment & Monitoring

### Cloud Infrastructure Health Checks

**Backend Health Check**
```bash
curl https://wenxin-moyun-api-asia-east1.run.app/health
# Expected: {"status": "healthy", "version": "1.0.0"}
```

**Frontend Health Check**  
```bash
curl https://storage.googleapis.com/wenxin-moyun-prod-static/index.html
# Expected: HTML content of React app
```

### Performance & Scaling

**Auto-scaling Configuration:**
- **Cloud Run**: 0-10 instances, 2GB memory, 1 vCPU, 100 concurrent requests
- **Cloud SQL**: db-f1-micro (upgradeable), 20GB SSD storage, auto-expanding
- **Cold Start**: ~2 seconds for backend, instant for frontend (CDN cached)

**Optimizations:**
- Multi-layer caching (API 5min, Static 30min, Realtime 30s)
- iOS design system reduces bundle size vs decorative elements
- WebSocket connection management with heartbeat
- Connection pooling with SQLAlchemy for database efficiency
- Gzip compression and asset caching on Cloud Storage

### Monitoring & Observability

**Available Dashboards:**
- **Cloud Monitoring**: https://console.cloud.google.com/monitoring/dashboards
- **Application Logs**: https://console.cloud.google.com/logs
- **Error Reporting**: https://console.cloud.google.com/errors  
- **Performance Traces**: https://console.cloud.google.com/traces

**Key Metrics Tracked:**
1. **API Health**: Response time, error rate, availability
2. **Resource Usage**: CPU, memory, database connections  
3. **Business Metrics**: Evaluations processed, user activity
4. **Security**: Authentication failures, suspicious activity

**Automated Alerts:**
- API downtime (>5 minutes)
- High error rate (>5%)
- High response time (>2 seconds)
- Resource exhaustion (CPU >80%, Memory >85%)
- Database connection issues

### Cost Optimization

**Estimated Monthly Costs:**
- Small-Medium Load (<10k requests/day): ~$30-70/month
- High Load (>100k requests/day): ~$155-520/month

**Cost-saving Features:**
- Cloud Run scale-to-zero during low traffic
- Committed use discounts for predictable workloads
- Storage lifecycle policies for old data archival
- Billing alerts to prevent unexpected charges

### Database Integrity
- Foreign key constraints properly configured
- NULL score handling for image models
- 42 AI models properly configured with provider routing
- Automated backups with 7-day retention
- Point-in-time recovery available

### Security & Compliance

**Security Headers Configured:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

**Data Protection:**
- HTTPS-only (TLS 1.2+)
- Secrets stored in Secret Manager (not environment variables)
- Database encryption at rest and in transit
- Cloud IAM for access control
- Regular credential rotation via Secret Manager

### API Documentation
- **Development**: http://localhost:8001/docs (Swagger UI)
- **Development**: http://localhost:8001/redoc (ReDoc)
- **Production**: Available at Cloud Run service URL + `/docs` or `/redoc`

### iOS Design System (Frontend)

Complete iOS design system with 60+ Fluent Emoji integration. Key components available:

```typescript
// Core iOS Components
<IOSButton variant="primary" size="md" glassMorphism>Action</IOSButton>
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Title" emoji={<RankEmoji rank={1} />} />
  <IOSCardContent>Content</IOSCardContent>
</IOSCard>
<IOSToggle checked={value} onChange={setValue} color="green" />
<IOSSlider value={50} min={0} max={100} formatValue={(v) => `${v}%`} />
<IOSAlert visible={show} type="info" title="Alert" actions={[...]} />

// Typography and Theme
<h1 className="text-large-title">iOS Typography</h1>
// Uses San Francisco font stack and iOS color palette (#007AFF, #34C759, etc.)
```

Detailed component documentation in `wenxin-moyun/CLAUDE.md`.

## Test Accounts
- Demo: username=`demo`, password=`demo123`  
- Admin: username=`admin`, password=`admin123`