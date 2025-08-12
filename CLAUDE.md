# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Full-stack AI art evaluation platform supporting **42 AI models** from **15 organizations**. Features complete iOS design system migration (2025-08-11), real benchmark testing with **Unified Model Interface**, and comprehensive E2E testing infrastructure.

**Architecture**:
- **Frontend**: React 19 + TypeScript 5.8 + Vite 7.1 with pure iOS design system
- **Backend**: FastAPI + SQLAlchemy with async evaluation engine and intelligent scoring
- **Database**: SQLite with proper foreign key constraints and NULL score handling for image models
- **Real-time**: WebSocket for live battle updates and progress tracking
- **AI Integration**: Unified Model Interface with provider adapters ensuring correct model routing
- **Testing**: Playwright E2E framework with 64 test cases across multiple browsers

## Essential Commands

### Quick Start
```bash
# Windows one-click startup (initializes DB, starts backend on :8001, frontend on :5173)
start.bat

# Manual startup (separate terminals):
cd wenxin-backend && python init_db.py                # Initialize database (first time only)
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev                        # Frontend (auto-increments from port 5173)
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
cd wenxin-backend
rm wenxin.db                  # Delete existing database (Windows: del wenxin.db)
python init_db.py             # Recreate with schema + sample data

# Check model rankings
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST'); print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]]); conn.close()"
```

## Architecture Overview

### Core System Flow
```
Frontend (React 19)          Backend (FastAPI)         Services Layer           Database (SQLite)
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

### Data Pipeline: Evaluation to Gallery
1. User creates evaluation task (Frontend) → Backend saves with parameters
2. Background processing via `evaluation_engine.py` → AI provider generates content
3. Intelligent scoring calculates metrics → Artwork automatically created
4. Gallery displays generated artworks with proper NULL score handling

## Critical System Components

### Unified Model Interface (Fixed Model Routing Bug)
- **app/services/models/unified_client.py** - Central interface for all AI models
- **app/services/models/model_registry.py** - Registry managing 42 AI models from 15 organizations  
- **app/services/models/adapters/** - Provider-specific adapters (OpenAI, Anthropic, Google, etc.)
- **Fixed Issue**: Previous system hardcoded gpt-4o-mini for all models; now correctly routes to designated APIs

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

## API Architecture

### Core Endpoints
- `GET /api/v1/models/` - AI model metadata with NULL-safe score handling
- `POST /api/v1/evaluations/` - Create evaluation task with language parameter
- `GET /api/v1/battles/random` - Get random active battle for voting
- `POST /api/v1/benchmarks/run` - Execute real AI model benchmarks

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
    max_tokens=500
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

## Testing & Quality Assurance

### E2E Testing (Playwright)
- **Configuration**: `wenxin-moyun/tests/e2e/playwright.config.ts` - Multi-browser setup
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome/Safari (5 projects total)
- **Test Organization**: 64 tests in 9 spec files with page objects pattern
- **Key Test Suites**:
  - `homepage.spec.ts` - Homepage functionality and navigation
  - `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering
  - `ios-components.spec.ts` - iOS design system components
  - `auth.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features
  - `performance.spec.ts`, `visual.spec.ts` - Performance and visual regression
- **Test Data**: Local fixtures in `tests/e2e/fixtures/local-test-data.ts`
- **Git Protection**: All test results excluded from repository via `.gitignore`

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

## Production Deployment

### Database Integrity
- Foreign key constraints properly configured
- NULL score handling for image models
- 42 AI models properly configured with provider routing

### Performance Optimizations  
- Multi-layer caching (API 5min, Static 30min, Realtime 30s)
- iOS design system reduces bundle size vs decorative elements
- WebSocket connection management with heartbeat

### API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

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