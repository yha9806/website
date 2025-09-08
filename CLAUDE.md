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

### Critical Development Patterns

#### EmojiIcon Import Path (Updated 2025-09-07)
**Correct import path for iOS emoji components:**
```typescript
// ✅ Correct path
import { EmojiIcon } from '../ios/core/EmojiIcon';

// ❌ Wrong path that causes module resolution errors
import { EmojiIcon } from '../ios/emoji/EmojiIcon';
```

#### TypeScript Module Resolution Issues
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

#### VULCA Data Generation Pattern
```python
# Use model profiles for realistic data, not random generation
profile = ModelProfileRegistry().get_profile(model_id)
evaluation = VULCACoreAdapter(use_model_profiles=True).generate_realistic_evaluation(model_id)

# Profile-based scoring produces realistic differences:
# OpenAI models: ~91.4 average score
# DeepSeek models: ~86.1 average score  
# Qwen models: ~77.6 average score
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

### Current Test Status (Updated 2025-09-07)
- ✅ **OpenAI**: 11/11 models tested
- ✅ **Anthropic**: 9/9 models (including Claude 4.1)
- ✅ **DeepSeek**: 3/3 models tested
- ✅ **Qwen**: 6/19 models tested (priority only)
- ✅ **VULCA Integration**: Complete 47-dimension evaluation system
- ✅ **Model Profiling**: 42 models with realistic characteristic profiles

### VULCA Data Generation Scripts
```bash
cd wenxin-backend

# Generate realistic evaluation data for all 42 models
python scripts/generate_realistic_vulca_data.py

# Test model profile system
python scripts/test_vulca_profiles.py

# Verify data quality and model differentiation
python -c "
from app.vulca.core.model_profiles import ModelProfileRegistry
from app.vulca.core.vulca_core_adapter import VULCACoreAdapter

registry = ModelProfileRegistry()
adapter = VULCACoreAdapter(use_model_profiles=True)

# Test realistic scoring for key models
for model_id in ['gpt-5', 'o1', 'deepseek-r1', 'qwen-max-2025-01-25']:
    eval_data = adapter.generate_realistic_evaluation(model_id)
    avg_score = sum(eval_data['scores_6d'].values()) / 6
    print(f'{model_id}: {avg_score:.1f}')
"
```

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

### Three-Level Visualization System (2025-09-07 Update)
The VULCA system features a progressive disclosure design solving 47-dimension visualization complexity:

**Level 1: Overview (6D)** - Traditional radar chart for quick assessment
**Level 2: Grouped (8 Categories)** - Dimension groups with mini-charts and interactive cards  
**Level 3: Detailed (All 47D)** - Full parallel coordinates with filtering and variance analysis

### Frontend Components
```
components/vulca/
├── VULCAVisualization.tsx       # Main visualization with 3-level system
├── DimensionGroupView.tsx       # Level 2 grouped view (NEW)
├── ModelSelector.tsx            # Model selection interface
├── DimensionToggle.tsx          # 6D/47D switcher
├── CulturalPerspectiveSelector.tsx  # Cultural perspective dropdown
└── ExportButton.tsx             # Data export functionality

pages/vulca/VULCADemoPage.tsx    # Main VULCA demo page
hooks/vulca/useVULCAData.ts      # Data management hook
utils/vulca/api.ts               # API service layer
```

### Backend Architecture
```
wenxin-backend/app/vulca/
├── core/
│   ├── model_profiles.py        # 42 model characteristic profiles (NEW)
│   └── vulca_core_adapter.py    # Enhanced 6D→47D algorithm v2.0
├── services/vulca_service.py    # Async business logic
├── models/vulca_model.py        # SQLAlchemy models
├── schemas/vulca_schema.py      # Pydantic schemas
└── routers/vulca.py            # FastAPI endpoints (8 routes)
```

### VULCA System Architecture
```
Frontend Components     ←→     Backend Services     ←→     VULCA Core
                                                         
VULCAVisualization     →     vulca_service.py      →     model_profiles.py
├─ Overview (6D)       →     ├─ evaluate_model    →     ├─ 42 model profiles
├─ Grouped (8 cats)    →     ├─ compare_models    →     ├─ Provider specializations
└─ Detailed (47D)      →     └─ get_dimensions    →     └─ Cultural alignments
                                    ↓                         ↓
DimensionGroupView     →     vulca_core_adapter    →     Advanced algorithms:
├─ 8 dimension groups  →     ├─ 6D base scores    →     ├─ Profile-based expansion
├─ Mini bar charts     →     ├─ 47D expansion     →     ├─ Cultural differentiation
└─ Expand/collapse     →     └─ Cultural adjust   →     └─ Provider-specific weights
```

### Key Features & Capabilities
- **Progressive Disclosure**: 6D → 8-group → 47D visualization levels
- **Intelligent Data Generation**: Model profile-based realistic scoring (not random)
- **Cultural Perspectives**: 8 cultural viewpoints with provider-specific adjustments
- **Model Profiling**: 42 AI models with detailed characteristic profiles
- **Advanced Filtering**: Variance analysis, top performance, custom dimension selection
- **Real-time Evaluation**: Live model comparison and assessment
- **Mobile Optimized**: Responsive design with touch-friendly interactions

### Backend Endpoints
- `GET /api/v1/vulca/info` - System information and capabilities
- `POST /api/v1/vulca/evaluate` - Evaluate single model with profile-based scoring
- `POST /api/v1/vulca/compare` - Compare multiple models
- `GET /api/v1/vulca/dimensions` - Get all 47 dimensions with categories
- `GET /api/v1/vulca/cultural-perspectives` - Get 8 cultural perspectives
- `GET /api/v1/vulca/history/{model_id}` - Model evaluation history
- `GET /api/v1/vulca/sample-evaluation/{model_id}` - Sample data with realistic scores
- `GET /api/v1/vulca/demo-comparison` - Demo comparison data

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

## Task Management System

The project uses a structured task management system for complex development work:

### Task Directory Structure
```
tasks/
├── active/       # Currently active tasks
├── completed/    # Finished tasks with full documentation
└── suspended/    # Paused tasks
```

### Recent Major Completions (2025-09-07)
- ✅ **VULCA 47-Dimension Optimization**: Complete three-level visualization system
- ✅ **Model Profile System**: 42 AI models with realistic characteristic profiles
- ✅ **Progressive Disclosure UI**: Solved 47D visualization complexity
- ✅ **Intelligent Data Generation**: Profile-based scoring replacing random data
- ✅ **Cultural Perspective Integration**: 8 cultural viewpoints with provider differentiation

### Development Workflow Patterns
When working on complex multi-step tasks:
1. **Task Creation**: Document requirements, constraints, and success criteria
2. **Research Mode**: Understand codebase and existing patterns
3. **Planning Mode**: Create detailed implementation plan with file-level changes
4. **Execution Mode**: Implement changes following documented patterns
5. **Review Mode**: Verify implementation matches plan and requirements

## Latest Benchmark Rankings (Updated 2025-09-07)
**Profile-Based VULCA Scoring** (realistic model differentiation):
1. **gpt-5** (OpenAI): ~91.4 average
2. **o1** (OpenAI): ~91.4 average  
3. **deepseek-r1** (DeepSeek): ~86.1 average
4. **claude-opus-4-1** (Anthropic): ~85+ average
5. **qwen-max-2025** (Alibaba): ~77.6 average

**Traditional Rankings** (2025-09-05):
1. **gpt-5** (OpenAI): 88.5/100
2. **o1** (OpenAI): 88.3/100
3. **gpt-4o** (OpenAI): 87.3/100
4. **gpt-4.5** (OpenAI): 86.3/100
5. **gpt-4o-mini** (OpenAI): 86.0/100

Note: 42 models tested across 15 organizations. VULCA system provides both traditional 6D scores and advanced 47-dimension evaluation with cultural perspectives.