# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **15 organizations**. Full-stack application featuring complete iOS design system migration, real AI model benchmarking with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

## 🚨 Critical: Google Cloud Account Migration (2025-08-16)

**IMPORTANT**: The project has been migrated from the wrong Google Cloud account to the correct paid account:
- **OLD**: `wenxin-moyun-prod` (yuhaorui88@gmail.com - wrong account)
- **NEW**: `wenxin-moyun-prod-new` (yuhaorui48@gmail.com - correct account with £946 credits)

All configurations have been updated to use the new project ID and service account.

## Architecture Overview

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
npm run dev            # Start dev server (port 5173+)
npm run build          # TypeScript check + production build
npm run lint           # ESLint validation
npm run preview        # Preview production build

# E2E Testing (Playwright - 64 test cases)
npm run test:e2e       # Run tests headless across all browsers
npm run test:e2e:ui    # Interactive UI mode for debugging
npm run test:e2e:debug # Step-by-step debugging mode
npm run test:e2e:headed # Run tests in visible browser
npm run test:e2e:report # Show HTML test report
npm run test:e2e -- --grep="auth" # Run specific test pattern

# MCP Testing (Model Context Protocol)
npm run test:mcp       # Run all MCP tests
npm run test:mcp:homepage # Test homepage via MCP
npm run test:mcp:ios   # Test iOS components via MCP
```

### Backend Development (wenxin-backend/)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data

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
python init_db.py      # Recreate with schema + sample data

# Check model rankings
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST'); print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]]); conn.close()"
```

## High-Level Architecture

### Tech Stack
**Frontend (wenxin-moyun/)**
- React 19 + TypeScript 5.8 + Vite 7.1
- Tailwind CSS 4.1 with pure iOS design tokens
- Zustand 4.4 state management
- Framer Motion 12.23 (iOS spring physics)
- Recharts 3.1 with D3 integration
- Playwright E2E (64 test cases across 9 spec files)

**Backend (wenxin-backend/)**
- FastAPI + SQLAlchemy (async)
- SQLite (dev) / PostgreSQL (production)
- Unified Model Interface with 8 provider adapters
- WebSocket for real-time battle updates
- Docker + Google Cloud Run deployment

### Critical System Components

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

## Google Cloud Platform Configuration

### Current Project Setup (After Migration)
**Project Information:**
- **Project Name**: `WenXin MoYun`
- **Project ID**: `wenxin-moyun-prod-new`
- **Region**: `asia-east1`
- **Service Name**: `wenxin-moyun`
- **Artifact Registry Repository**: `wenxin-images`

**GitHub Actions Service Account:**
- **Email**: `github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com`
- **Purpose**: Automated CI/CD deployment to Google Cloud Platform

### Required IAM Roles
1. **Artifact Registry Administrator** - Create/manage Docker repositories
2. **Cloud Run Admin** - Deploy services to Cloud Run
3. **Cloud SQL Admin** - Manage database connections and migrations
4. **Secret Manager Secret Accessor** - Access API keys and secrets
5. **Storage Admin** - Deploy frontend to Cloud Storage

### Secret Manager Configuration
**Secrets stored in GCP Secret Manager:**
- `db-password` - Database password for PostgreSQL
- `secret-key` - Application secret key for JWT tokens
- `openai-api-key` - OpenAI API key for AI model access
- `anthropic-api-key` - Anthropic API key for Claude models
- `gemini-api-key` - Google Gemini API key

### GitHub Secrets
**Required in GitHub Repository Settings:**
- `GCP_SA_KEY` - Service account JSON (Updated 2025-08-16)
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `GEMINI_API_KEY` - Google Gemini API (optional)

## Testing Architecture

### E2E Testing (Playwright)
**Configuration**: 
- Local: `tests/e2e/playwright.config.ts`
- CI: `tests/e2e/playwright.ci.config.ts` (optimized for CI stability)

**Test Organization** (64 tests across 9 spec files):
- `homepage.spec.ts` - Homepage functionality and navigation
- `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering
- `ios-components.spec.ts` - iOS design system components
- `auth.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features
- `performance.spec.ts`, `visual.spec.ts` - Performance and visual regression

**CI-Specific Optimizations**:
- Increased timeouts: global (60s), action (30s), navigation (60s), expect (15s)
- Single worker process, no parallelization for stability
- Enhanced retry logic (2 retries in CI vs 1 locally)

### Critical Testing Patterns
```typescript
// Strict mode compliance - avoid multiple element matches
page.locator('.error-element').first()  // Use .first() for multi-element matches

// Flexible locators with proper .or() syntax
page.locator('text=/error/i').or(page.locator('.error-page'))  // NOT comma-separated

// Safe storage access for CI compatibility
if (process.env.CI) {
  // Use mocks or skip localStorage operations
  return;
}
```

## Deployment

### Automated Deployment (GitHub Actions)
**Triggers**: Every push to main/master branch, PRs to main/master
1. **Test Phase**: Frontend build, backend tests, E2E tests (CI-specific config)
2. **Deploy Phase**: Docker build/push to Artifact Registry, database migrations, Cloud Run deployment
3. **Release Phase**: Automated release notes with commit history and service URLs

**Production URLs**:
- **Frontend**: `https://storage.googleapis.com/wenxin-moyun-prod-new-static/`
- **Backend API**: Deployed to Cloud Run (URL in deployment logs)
- **API Docs**: `[BACKEND_URL]/docs`

### Manual Deployment
```bash
# Backend
docker build -f wenxin-backend/Dockerfile.cloud -t asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest wenxin-backend/
docker push asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest
gcloud run deploy wenxin-moyun-api --image=asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest --region=asia-east1

# Frontend
cd wenxin-moyun && npm run build
gsutil -m rsync -r -d dist/ gs://wenxin-moyun-prod-new-static/
```

## Development Patterns

### TypeScript Integration
**Type Definitions**: `wenxin-moyun/src/types/types.ts`
- Always use `import type` for TypeScript types
- Key interfaces: `Model`, `ModelMetrics`, `Battle`, `LeaderboardEntry`

### Component Architecture
```
Layout (wraps all pages)
  └── Pages (route-level components)
       └── iOS Components (src/components/ios/)
            ├── Core (IOSButton, IOSCard, IOSToggle, etc.)
            ├── Emoji System (60+ Fluent Emoji SVGs)
            └── Utils (iosTheme.ts, animations.ts, emojiMap.ts)
       └── Feature Components (evaluation/, auth/, charts/)
```

### State Management
- **Zustand stores**: UI state, filters, preferences
- **Custom hooks**: Business logic abstraction
- **Component state**: Local form and UI interactions
- **Mock data**: Static data in `src/data/mockData.ts` for development

### Responsive Design
- **Mobile-first**: 375px baseline with 44px touch targets
- **Breakpoints**: `md: 768px`, `lg: 1024px`, `xl: 1200px`
- **Glass morphism**: Uses backdrop-blur and opacity layering

## Common Issues & Solutions

### TypeScript Compilation
- **Issue**: react-spring type conflicts with Framer Motion
- **Solution**: Use Framer Motion exclusively for animations
- **Pattern**: Import types with `import type { ... }` to avoid runtime issues

### Database Constraints
- **Foreign Key Validation**: Battle system validates model relationships
- **NULL Score Handling**: Image models intentionally have NULL overall_score
- **Chart Rendering**: Filter NULL values before D3 scale calculations

### Performance Optimizations
- **Bundle Size**: iOS design system reduces size vs decorative elements
- **Caching**: Multi-layer caching (API 5min, Static 30min, Realtime 30s)
- **WebSocket Management**: Connection pooling with heartbeat

### Development Environment
- **Port Conflicts**: Frontend auto-increments from 5173
- **Windows Compatibility**: Use `del` instead of `rm`, check Windows Defender
- **Node.js Version**: Must use 20.19.4 for CI compatibility

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`