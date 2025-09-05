# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔧 Vite Cache Issues & Solutions

### Problem: Module Export Errors
If you encounter errors like "The requested module does not provide an export named 'XXX'":

**Quick Fix Commands:**
```bash
npm run dev:clean       # Clear cache and start dev server
npm run dev:fresh       # Complete cache reset and start
npm run cache:clear     # Clear all caches (manual)
```

**Permanent Optimizations Applied:**
- Windows file watching with polling enabled
- TypeScript incremental compilation disabled 
- Forced dependency pre-bundling
- Optimized HMR configuration
- Custom cache directory (`.vite`)

**When to Use Each Command:**
- `dev:clean` - First attempt when encountering module errors
- `dev:fresh` - When dev:clean doesn't resolve the issue
- `cache:clear` - Before switching branches or major refactoring

## Project Overview

WenXin MoYun - AI model benchmarking platform testing 42 models from 15 organizations including OpenAI, Anthropic, DeepSeek, and Qwen. Features React 19 frontend with iOS design system, FastAPI backend with async SQLAlchemy, VULCA 47-dimension evaluation framework, and production GCP deployment.

**Production URLs:**
- Frontend: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/
- Backend API: https://wenxin-moyun-api-229980166599.asia-east1.run.app

## Essential Commands

### Quick Start
```bash
# Windows: start.bat | Linux/macOS: ./start.sh
# Starts backend (:8001) + frontend (:5173) + initializes DB
```

### Frontend (wenxin-moyun/)
```bash
npm install --legacy-peer-deps  # React 19 compatibility
npm run dev                     # Dev server :5173
npm run build                   # Production build
npm run lint                    # ESLint validation
npm run type-check              # TypeScript validation only

# Playwright E2E Testing (64 test cases)
npm run test:e2e               # Run all tests headless
npm run test:e2e:ui            # Interactive test UI
npm run test:e2e:debug         # Debug mode step-by-step
npm run test:e2e:headed        # Run in visible browser
npm run test:e2e:report        # Show HTML test report
npm run test:e2e -- --grep="auth"  # Run specific test pattern

# MCP Testing
npm run test:mcp               # Run MCP tests
npm run test:mcp:homepage      # Test homepage specifically
```

### Backend (wenxin-backend/)
```bash
pip install -r requirements.txt -c constraints.txt  # ALWAYS use constraints
python -m uvicorn app.main:app --reload --port 8001
python init_db.py              # Reset DB with 42 models
pytest tests/ -v               # Run all tests verbose
pytest tests/test_auth.py -v   # Run specific test
pytest --cov=app tests/        # Test coverage report
```

### AI Model Testing
```bash
cd wenxin-backend

# Test specific providers (with API keys set)
python test_qwen_complete.py --priority  # Test 6 priority Qwen models
python test_anthropic_final.py          # Test Claude models
python test_claude_41_retry.py          # Test Claude 4.1 with retry
python test_deepseek_r1_complete.py     # Test DeepSeek models

# Generate reports
python merge_all_results_v2.py          # Merge all test results
python generate_final_report_clean.py   # Comprehensive benchmark report
```

## Architecture Patterns

### Frontend Architecture

#### HashRouter (Required for Cloud Storage)
```typescript
// All routes use hash: #/, #/leaderboard, #/battle, #/model/:id, #/vulca
const withRoute = (path: string): string => {
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};
```

#### Component Structure
```
src/
├── components/
│   ├── ios/              # Complete iOS design system
│   │   ├── core/         # IOSButton, IOSCard, IOSToggle, IOSSlider, IOSAlert
│   │   └── emoji/        # EmojiIcon, StatusEmoji, RankEmoji, TypeEmoji
│   ├── vulca/            # VULCA evaluation components
│   │   ├── VULCAVisualization.tsx
│   │   ├── DimensionToggle.tsx
│   │   └── CulturalPerspectiveSelector.tsx
│   └── common/           # Shared components
├── pages/                # Route-level pages
├── hooks/                # Custom hooks including vulca/useVULCAData
├── utils/                # Utilities including vulca/api.ts
└── types/                # TypeScript definitions
```

#### State Management
- **Zustand**: For global UI state and preferences
- **Custom Hooks**: Business logic abstraction (useVULCAData, useAuth, etc.)
- **React State**: Component-level state management

### Backend Architecture

#### OAuth2 Authentication
```typescript
// Must use form-urlencoded, NOT JSON
const formParams = new URLSearchParams();
formParams.append('username', username);
formParams.append('password', password);
```

#### Unified Model Interface
```python
# Different models require different parameters
'gpt-5': max_completion_tokens=500  # NOT max_tokens
'o1': # No system messages, no temperature
'deepseek-chat': # Use for R1/R1-distill/V3, NOT deepseek-reasoner
'claude-opus-4-1-20250805': # No temperature AND top_p together
```

#### VULCA Integration
```python
# Backend modules
app/services/vulca_core_adapter.py  # 6D→47D expansion algorithm
app/services/vulca_service.py       # Async business logic
app/models/vulca_model.py           # SQLAlchemy models
app/schemas/vulca_schema.py         # Pydantic schemas
app/routers/vulca.py               # FastAPI endpoints (8 routes)
```

### NULL Score Handling
```typescript
// Image models have intentional NULL scores
{score != null ? score.toFixed(1) : 'N/A'}
```

### TypeScript Module Resolution Issues
When encountering Vite module export errors, use local type definitions as temporary workaround:
```typescript
// Temporary fix: define types locally to avoid module resolution issues
interface VULCAScore6D {
  creativity: number;
  technique: number;
  emotion: number;
  context: number;
  innovation: number;
  impact: number;
}
```

## Model Testing Infrastructure

### API Configurations
```python
# Qwen (DashScope)
client = AsyncOpenAI(
    api_key=QWEN_API_KEY,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
)
models: qwen-max-2025-01-25, qwen-plus, qwen-flash, qwen3-32b, qwen3-8b

# Anthropic
client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
models: claude-3-5-sonnet-20241022, claude-opus-4-1-20250805, claude-opus-4-0

# DeepSeek
client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=...)
models: deepseek-v3 (use deepseek-chat endpoint), deepseek-r1, deepseek-r1-distill
```

### Test Results Structure
```
benchmark_results/
├── openai/         # openai_results.json
├── anthropic/      # anthropic_complete_v2.json, claude_41_retry.json
├── deepseek/       # deepseek_benchmark_report.json
├── qwen/           # qwen_complete.json (6 priority models tested)
└── reports/        # comprehensive_v2.json/md
```

### Current Test Status (2025-08-20)
- ✅ **OpenAI**: 11/11 models tested
- ✅ **Anthropic**: 9/9 models (including Claude 4.1)
- ✅ **DeepSeek**: 3/3 models tested
- ✅ **Qwen**: 6/19 models tested (priority only)

## Production Deployment

### Critical Requirements
- Python 3.13 (must match dev/prod)
- Node.js 20.19.4 (CI compatibility)
- Bind to `0.0.0.0` not localhost
- Use `${PORT:-8080}` environment variable

### Database Migrations
```bash
alembic upgrade head  # NOT alembic stamp
# Run via Cloud Run Jobs, not inline
```

### Common Deployment Issues
1. **Port binding**: Check `${PORT:-8080}` and `0.0.0.0` binding
2. **Package versions**: Always use constraints.txt
3. **Missing columns**: Run proper alembic upgrade
4. **API auth failures**: Verify environment keys in Secret Manager
5. **Claude 4.1 500 errors**: Use retry mechanism (test_claude_41_retry.py)
6. **Vite module caching**: Clear with `rm -rf node_modules/.vite .vite`

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`

## GCP Configuration
- Project ID: `wenxin-moyun-prod-new`
- Region: `asia-east1`
- Services: Cloud Run, Cloud Storage, Cloud SQL, Secret Manager
- Artifact Registry: `asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images`

## iOS Design System

### Core Components
```typescript
// IOSButton - Native iOS button with glass morphism
<IOSButton variant="primary" size="lg" glassMorphism emoji="like">
  Action
</IOSButton>

// IOSCard - Structured container
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Title" emoji={<RankEmoji rank={1} />} />
  <IOSCardContent>Content</IOSCardContent>
  <IOSCardFooter><IOSButton>Action</IOSButton></IOSCardFooter>
</IOSCard>

// IOSToggle - iOS-style switches
<IOSToggle checked={value} onChange={setValue} color="green" />

// IOSSlider - Value sliders
<IOSSlider value={val} onChange={setVal} min={0} max={100} />

// IOSAlert - Modal alerts
<IOSAlert visible={show} onClose={() => setShow(false)} type="info" />
```

### Emoji System
60+ Microsoft Fluent Emoji SVGs:
```typescript
<StatusEmoji status="completed" animated />  // ✅
<RankEmoji rank={1} size="lg" />            // 🥇
<TypeEmoji type="painting" size="md" />     // 🎨
<EmojiIcon category="actions" name="like" animated />
```

## VULCA Framework Integration

### Frontend Components
- `pages/vulca/VULCADemoPage.tsx` - Main demo page
- `components/vulca/VULCAVisualization.tsx` - 4 visualization types
- `hooks/vulca/useVULCAData.ts` - Data management hook
- `utils/vulca/api.ts` - API service layer

### Backend Endpoints
- `GET /api/v1/vulca/info` - System information
- `POST /api/v1/vulca/evaluate` - Evaluate model
- `POST /api/v1/vulca/compare` - Compare models
- `GET /api/v1/vulca/dimensions` - Get 47 dimensions
- `GET /api/v1/vulca/cultural-perspectives` - Get 8 perspectives
- `GET /api/v1/vulca/history/{model_id}` - Model history
- `GET /api/v1/vulca/sample-evaluation/{model_id}` - Sample data
- `GET /api/v1/vulca/demo-comparison` - Demo comparison

### Key Features
- 6D to 47D dimension expansion algorithm
- 8 cultural perspectives evaluation
- 4 visualization types (Radar, Heatmap, Bar, Parallel)
- Real-time evaluation and comparison

## Playwright Testing Patterns

### Strict Mode Compliance
```typescript
// ❌ Wrong: Multiple element matches
page.locator('[required]')

// ✅ Correct: Use .first() for multiple matches
page.locator('[required]').first()

// ❌ Wrong: Invalid .or() syntax
page.locator('text=/error/i, .error-page')

// ✅ Correct: Proper .or() method
page.locator('text=/error/i').or(page.locator('.error-page'))
```

### Test Structure
- 64 test cases across 9 spec files
- Coverage: auth, battle, evaluation, homepage, iOS components, AI models, performance, visual
- Run specific: `npm run test:e2e -- --grep="pattern"`

## Latest Benchmark Rankings (2025-09-05)
1. **gpt-5** (OpenAI): 88.5/100
2. **o1** (OpenAI): 88.3/100
3. **gpt-4o** (OpenAI): 87.3/100
4. **gpt-4.5** (OpenAI): 86.3/100
5. **gpt-4o-mini** (OpenAI): 86.0/100

Note: 42 models tested across 15 organizations with comprehensive evaluation metrics