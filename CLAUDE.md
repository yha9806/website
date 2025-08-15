# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Enterprise-grade AI art evaluation platform supporting **42 AI models** from **15 organizations**. Full-stack application featuring complete iOS design system migration, real AI model benchmarking with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

**Key Features:**
- Real-time AI model evaluation and ranking system
- Multi-provider AI integration (OpenAI, Anthropic, Google, etc.)
- iOS-style design system with glass morphism effects
- Live battle voting system with WebSocket real-time updates
- Comprehensive benchmark testing with intelligent scoring
- Production-ready cloud deployment on Google Cloud Platform

## Architecture Overview

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

### Tech Stack
**Frontend (wenxin-moyun/)**
- **Framework**: React 19 + TypeScript 5.8 + Vite 7.1
- **Styling**: Tailwind CSS 4.1 with pure iOS design tokens
- **State**: Zustand 4.4 + custom hooks
- **Animation**: Framer Motion 12.23 (iOS spring physics)
- **Charts**: Recharts 3.1 with D3 integration
- **Testing**: Playwright E2E (64 test cases across 9 spec files)

**Backend (wenxin-backend/)**
- **Framework**: FastAPI + SQLAlchemy (async)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **AI Integration**: Unified Model Interface with 8 provider adapters
- **Real-time**: WebSocket for battle updates
- **Deployment**: Docker + Google Cloud Run

## Essential Commands

### Frontend Development (wenxin-moyun/)
```bash
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
npm run test:e2e -- --grep="auth"  # Run specific test pattern

# Environment validation
npm run validate-env          # Verify Node.js/Python versions match CI
```

### Backend Development (wenxin-backend/)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data

# Testing
pytest                        # Run all tests
pytest tests/test_auth.py -v  # Run specific test verbose
pytest -k "test_login" -v     # Run tests matching pattern
pytest --cov=app tests/       # Test coverage

# AI Model Testing
python test_unified_interface.py  # Verify models use correct APIs
python openai_benchmark.py        # Run real AI benchmarks
```

### Full Stack Development
```bash
# Windows one-click startup (recommended)
start.bat                     # Initializes DB, starts backend (:8001) + frontend (:5173)

# Manual startup (separate terminals)
cd wenxin-backend && python init_db.py && python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev
```

### Database Operations
```bash
# Development (SQLite)
cd wenxin-backend
rm wenxin.db                  # Delete existing database (Windows: del wenxin.db)
python init_db.py             # Recreate with schema + sample data

# Check model rankings
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST'); print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]]); conn.close()"
```

## Critical System Components

### Unified Model Interface (Core AI Integration)
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

### iOS Design System (Frontend)
**Location**: `wenxin-moyun/src/components/ios/`

**Core Components:**
```typescript
// Native iOS button with glass morphism
<IOSButton variant="primary" size="lg" glassMorphism emoji="like">
  Action
</IOSButton>

// Container with structured content
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Title" emoji={<RankEmoji rank={1} />} />
  <IOSCardContent>Content</IOSCardContent>
  <IOSCardFooter>
    <IOSButton>Action</IOSButton>
  </IOSCardFooter>
</IOSCard>

// iOS-style controls
<IOSToggle checked={value} onChange={setValue} color="green" />
<IOSSlider value={50} min={0} max={100} formatValue={(v) => `${v}%`} />
```

**Theme System**: `src/components/ios/utils/iosTheme.ts`
- iOS system colors (#007AFF, #34C759, #FF9500, #FF3B30)
- Native shadows and glass morphism effects
- San Francisco font stack

### Real-time Battle System
**Backend**: `wenxin-backend/app/api/v1/battles.py` + WebSocket
**Frontend**: `wenxin-moyun/src/hooks/useWebSocket.ts`

**WebSocket endpoint**: `/api/v1/ws/battle` for live vote updates

### Database Models & NULL Handling Pattern
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

**Model Types:**
- `llm` - Language models (has overall_score)
- `image` - Image models (overall_score = NULL)  
- `multimodal` - Can handle both (has overall_score)

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

## Testing Architecture

### E2E Testing (Playwright)
**Configuration**: 
- Local: `tests/e2e/playwright.config.ts`
- CI: `tests/e2e/playwright.ci.config.ts`

**Test Organization** (64 tests across 9 spec files):
- `homepage.spec.ts` - Homepage functionality and navigation
- `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering  
- `ios-components.spec.ts` - iOS design system components
- `auth.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features
- `performance.spec.ts`, `visual.spec.ts` - Performance and visual regression

**CI/Local Parity**: Enhanced storage mock system ensures consistent behavior between local development and GitHub Actions CI.

### Critical Testing Patterns
```typescript
// Safe storage access for CI compatibility
if (process.env.CI) {
  // Use mocks or skip localStorage operations
  return;
}

// Flexible locators for stability
page.locator('.btn-primary')
  .or(page.locator('button:has-text("Sign In")'))
  .or(page.locator('.ios-button'))
```

## Production Deployment

### Google Cloud Platform Infrastructure
**Architecture**:
```
Internet → Cloud CDN → Cloud Storage (Frontend)
                    ↘
                     Cloud Run (Backend API) ← Artifact Registry
                             ↓
                     Cloud SQL (PostgreSQL)
                             ↓
                     Secret Manager (API Keys)
```

**Auto-scaling**: 0-10 instances, 2GB memory, 1 vCPU
**Cold start**: ~2 seconds backend, instant frontend (CDN cached)

### Deployment Commands
```bash
# Automated setup (recommended)
chmod +x scripts/setup-gcp.sh && ./scripts/setup-gcp.sh

# Manual backend deployment
docker build -f wenxin-backend/Dockerfile.cloud -t asia-east1-docker.pkg.dev/PROJECT/wenxin-images/wenxin-backend:latest wenxin-backend/
docker push asia-east1-docker.pkg.dev/PROJECT/wenxin-images/wenxin-backend:latest
gcloud run deploy wenxin-moyun-api --image=asia-east1-docker.pkg.dev/PROJECT/wenxin-images/wenxin-backend:latest --region=asia-east1

# Frontend deployment
cd wenxin-moyun && npm run build
gsutil -m rsync -r -d dist/ gs://PROJECT-static/
```

### Environment Configuration
**Required Environment Variables:**
```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8001  # Development
VITE_API_VERSION=v1

# Backend (.env)  
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db  # Development
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-key  # + 7 other AI provider keys
```

**Version Lock Files** (for CI consistency):
- `.nvmrc` - Node.js 20.19.4
- `.python-version` - Python 3.10
- `.npmrc` - npm configuration (legacy-peer-deps=true)

## GitHub Actions CI/CD

### Automated Pipeline
**Triggers**: Every push to main branch
1. **Test Phase**: Linting, building, backend tests, E2E tests
2. **Deploy Phase**: Docker build/push, database migrations, health checks
3. **Release Phase**: Deployment notes with commit history

### Required GitHub Secrets
| Secret | Description | Source |
|--------|-------------|---------|
| `GCP_SA_KEY` | Service account JSON | Google Cloud Console |
| `OPENAI_API_KEY` | OpenAI API access | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic API access | https://console.anthropic.com/ |

### Common CI Issues & Solutions
**localStorage/sessionStorage in CI**:
```typescript
// Problem: Direct storage access fails in headless CI
// Solution: Use enhanced SafeStorageAccessor with memory fallback
import { safeStorage } from './utils/storage-mock';
safeStorage.setLocalItem('access_token', token);
```

**Playwright Locator Syntax**:
```typescript
// ❌ WRONG: Mixing regex flags with CSS selectors
page.locator('text=/error/i, .error-page')

// ✅ CORRECT: Use .or() method
page.locator('text=/error/i').or(page.locator('.error-page'))
```

## Known Issues & Solutions

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

## API Documentation

**Development**: http://localhost:8001/docs (Swagger UI)
**Core Endpoints**:
- `GET /api/v1/models/` - AI model metadata with NULL-safe scores
- `POST /api/v1/evaluations/` - Create evaluation tasks
- `GET /api/v1/battles/random` - Random battle for voting
- `GET /health` - Health check for monitoring

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`