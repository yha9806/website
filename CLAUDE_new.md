# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Full-stack AI art evaluation platform with real benchmark testing system and bilingual (Chinese/English) content generation. Features React 19 frontend with iOS-style interface, FastAPI backend with dual authentication (JWT + guest mode), and **Unified Model Interface** ensuring correct AI model routing.

**Key Achievement**: Fixed critical bug where all models were using gpt-4o-mini. Now each of the **37 AI models** from **15 organizations** correctly uses its designated API endpoint through the Unified Model Interface.

**Architecture Highlights**:
- **Unified Model Interface**: Central model registry with dynamic provider routing
- **Real Benchmark Testing**: Accurate model evaluation with proper API usage
- **Intelligent Scoring**: Multi-criteria evaluation using GPT-4o-mini
- **Model Type Separation**: Proper handling of language, image, and multimodal models

## Essential Commands

### Quick Start
```bash
# Windows one-click startup
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
npx vite build                # Build without TypeScript check if needed

# E2E Testing (Playwright)
npm run test:e2e              # Run tests headless
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:debug        # Step-by-step debugging
npm run test:e2e:headed       # Run in visible browser
npm run test:e2e:report       # Show test report
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

# Benchmark Testing (Real AI Model Evaluation)
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

# Direct database queries
python -c "import sqlite3; conn = sqlite3.connect('wenxin.db'); cursor = conn.cursor(); cursor.execute('SELECT * FROM evaluation_tasks'); print(cursor.fetchall()); conn.close()"
```

## High-Level Architecture

### Four-Layer Architecture with Unified Model Interface
```
Frontend (React 19)          Backend (FastAPI)         Services Layer           Database (SQLite)
    ↓                           ↓                         ↓                        ↓
iOS Components              API v1 Routers         Unified Model Interface    Core Tables
    ↓                           ↓                         ↓                    - users
Custom Hooks               Async Handlers         Model Registry             - ai_models
    ↓                           ↓                         ↓                    - battles  
Axios Client ──────→      Service Layer ───→    Provider Adapters          - evaluation_tasks
                                                         ↓                    - artworks
                                                   BenchmarkRunner           
                                                         ↓                 Benchmark Tables
                                                 Intelligent Scoring        - benchmark_suites
                                                                           - benchmark_runs
```

### Data Flow - Evaluation to Artwork Pipeline
```
1. User creates evaluation task (Frontend)
   ↓
2. Task saved to database with language parameter (Backend)
   ↓
3. Background processing via evaluation_engine.py
   ↓
4. AI Provider generates content (Mock/OpenAI/etc)
   ↓
5. Intelligent scoring calculates metrics
   ↓
6. Artwork automatically created from evaluation
   ↓
7. Gallery displays generated artworks
```

### Model Type Separation (Critical for Data Integrity)
- **Language Models (LLMs)**: Can generate text, evaluated with poetry/story benchmarks
- **Image Models**: Cannot generate text, show N/A for text benchmarks
- **Multimodal Models**: Can handle both text and images

## Critical Files & Their Roles

### Backend Core Services
- **app/services/evaluation_engine.py** - Orchestrates async evaluation pipeline
  - `_evaluate_poem()`, `_evaluate_story()` - Task type handlers (Note: language param read from task.parameters)
  - `_create_artwork_from_evaluation()` - Auto-creates gallery items

### Unified Model Interface (Critical Fix for Model Routing)
- **app/services/models/unified_client.py** - Single interface for all AI models
  - Replaces broken provider_manager that ignored model_name parameter
  - Dynamic routing to correct provider adapters
  - Handles model-specific requirements (GPT-5 needs max_completion_tokens)
- **app/services/models/model_registry.py** - Central registry for 37 AI models
  - Singleton pattern for model configuration management
  - Tracks provider, API names, special handling requirements
- **app/services/models/adapters/** - Provider-specific adapters
  - OpenAIAdapter: Fixed to use actual model parameter (was hardcoded to gpt-4o-mini)
  - DeepSeek, Qwen, XAI, OpenRouter, Gemini, Anthropic adapters
- **app/services/intelligent_scoring/ai_scorer.py** - **Real AI scoring** using GPT-4o-mini with intelligent fallback

### Benchmark System (Real AI Model Testing)
- **app/services/benchmark/benchmark_runner.py** - Executes benchmark tests against AI models
  - Now uses UnifiedModelClient instead of broken provider_manager
  - `run_suite_for_model()` - Core benchmark execution with proper model routing
  - `_execute_test_case()` - Uses unified interface for correct model selection
  - `_score_result()` - Multi-criteria scoring (rhythm, imagery, emotion, creativity, cultural_relevance)
- **app/services/benchmark/real_time_ranker.py** - Dynamic ranking calculation with weighted scoring

### Frontend Core Systems
- **src/services/api.ts** - Axios client with guest sessions, caching, offline detection
- **src/utils/cache.ts** - Multi-layer caching (API 5min, Static 30min, Realtime 30s)
- **src/hooks/useLeaderboard.ts** - Fetches and transforms model data for rankings
- **src/components/leaderboard/LeaderboardCard.tsx** - Handles NULL scores with N/A display
- **src/components/leaderboard/LeaderboardTable.tsx** - Table view with NULL score handling

### Database Models
- **app/models/ai_model.py** - Enhanced with benchmark fields:
  - `data_source`: "mock", "real", "benchmark", "not_applicable" - tracks data authenticity
  - `model_type`: "llm", "image", "multimodal" - critical for proper evaluation
  - `overall_score`: Can be NULL for image models
- **app/schemas/ai_model.py** - Pydantic models with Optional[float] for scores

## API Endpoints

### Core Endpoints
- `POST /api/v1/evaluations/` - Create evaluation task (includes language param)
- `GET /api/v1/evaluations/{id}` - Get task details with results
- `GET /api/v1/artworks/` - Gallery data from completed evaluations
- `GET /api/v1/models/` - AI model metadata with benchmark scores (handles NULL scores)

### Benchmark Testing Endpoints
- `POST /api/v1/benchmarks/run` - Execute benchmark test
  - **Body**: `{"suite_id": "UUID", "model_id": "UUID"}`
  - **Returns**: Complete results with scores, times, error details
- `GET /api/v1/benchmarks/` - List available benchmark suites

### API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Development Patterns

### Adding New AI Models
1. Edit `app/services/models/configs/model_configs.py`
2. Add model configuration:
```python
model_registry.register_model(ModelConfig(
    model_id='model-name',
    api_model_name='actual-api-endpoint',
    provider='openai',  # or deepseek, qwen, etc.
    requires_special_handling={'max_completion_tokens': True},  # if needed
    max_tokens=128000,
    # ... other config
))
```
3. Model is automatically available through unified interface

### Adding New Features
1. **Backend**: Model → Schema → Router → Service → Register in main.py
2. **Frontend**: Types → Service → Hook → Component → Route in App.tsx

### Handling NULL Scores (Critical for Image Models)
```typescript
// Frontend - Always check for null before using toFixed()
{score != null ? score.toFixed(1) : 'N/A'}

// Backend - Schema must allow Optional[float]
overall_score: Optional[float] = None
```

### Using the Unified Model Interface
```python
# Old broken way (provider_manager ignored model_name):
response = await provider_manager.generate_poem(
    prompt="Spring",
    model_name="gpt-5"  # Was ignored! Always used gpt-4o-mini
)

# New working way (unified interface):
from app.services.models import UnifiedModelClient
client = UnifiedModelClient()
response = await client.generate(
    model_id="gpt-5",  # Actually uses GPT-5 API!
    prompt="Write a poem about Spring",
    max_tokens=500
)
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

# AI Provider Keys (8 Providers Configured)
OPENAI_API_KEY=your-openai-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here  
QWEN_API_KEY=your-qwen-key-here
XAI_API_KEY=your-xai-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
GEMINI_API_KEY=your-gemini-key-here
HUGGINGFACE_API_KEY=your-huggingface-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

## Model Type Separation & NULL Score Handling

The system manages **37 AI models** from **15 organizations** with proper type separation:

- **Language Models (LLMs)**: Can generate text, evaluated with poetry/story benchmarks
- **Image Models**: Cannot generate text, show N/A for text benchmarks
- **Multimodal Models**: Can handle both text and images

**Image Model Handling**: Image models (Midjourney, DALL-E, Stable Diffusion) have NULL scores in database and display as "N/A" in frontend. They cannot be evaluated with text generation benchmarks.

### NULL Score Handling in Frontend
All frontend components are NULL-safe:
```typescript
// Correct pattern for displaying scores
{score != null ? score.toFixed(1) : 'N/A'}

// Sorting with NULL handling
.sort((a, b) => {
  if (a.overall_score == null && b.overall_score == null) return 0;
  if (a.overall_score == null) return 1;  // NULL scores go to end
  if (b.overall_score == null) return -1;
  return b.overall_score - a.overall_score;
})
```

## Known Issues & Solutions

### Port Conflicts
Frontend auto-increments from 5173 if occupied. Check console output for actual port.

### CORS Issues
Update `cors_origins` in `wenxin-backend/app/main.py` when frontend port changes.

### Image Model Scoring
- Image models (Midjourney, DALL-E, Stable Diffusion) correctly show "N/A" for text benchmarks
- They cannot be evaluated with poetry/story generation tests
- Separate evaluation metrics needed (FID, IS, CLIP Score)

### SQLAlchemy & Pydantic Issues
- Use `.is_(True)` instead of `== True` for boolean columns
- Ensure all Pydantic schemas handle Optional fields for NULL database values
- Image models have NULL overall_score - this is correct and intentional

### Windows-Specific Issues
- Use `del` instead of `rm` for file deletion
- Use `start.bat` for easy startup
- Check Windows Defender/firewall for port blocking

## Database Inspection Tools

```python
# Check model rankings and scores
python -c "
import sqlite3
conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()
cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST')
for row in cursor.fetchall():
    score = row[2] if row[2] is not None else 'N/A'
    print(f'{row[0]:<30} Type: {row[1]:<10} Score: {score}')
conn.close()
"

# Verify model type separation
python -c "
import sqlite3
conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()
cursor.execute('SELECT model_type, COUNT(*), COUNT(overall_score) FROM ai_models GROUP BY model_type')
for row in cursor.fetchall():
    print(f'{row[0]}: {row[1]} total, {row[2]} with scores')
conn.close()
"
```

## React 19 & iOS Design System

### iOS Component Usage
```typescript
// Modern iOS Typography
<h1 className="text-large-title">WenXin MoYun</h1>

// iOS Button System  
<IOSButton variant="primary" size="lg" glassMorphism>
  Explore Rankings  
</IOSButton>

// iOS Card System
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Leading Models" />
  <IOSCardContent>Card content</IOSCardContent>
  <IOSCardFooter>
    <IOSButton className="w-full">View Details</IOSButton>
  </IOSCardFooter>
</IOSCard>
```

### Design Philosophy
- **Pure iOS Visual Language**: Authentic Apple design system
- **Glass Morphism**: Native iOS-style transparency effects
- **San Francisco Font**: iOS system typography
- **System Colors**: Blue #007AFF, Green #34C759, Orange #FF9500

## Guest Session Management
Frontend generates guest ID via `crypto.randomUUID()` and sends in `X-Guest-Id` header. Backend tracks daily usage limits per guest.

## Critical Bug Fix: Model Routing Issue Resolved

### Previous Issue (Now Fixed)
- **Problem**: All models were using gpt-4o-mini due to hardcoded provider implementation
- **Evidence**: provider_manager.py line 267: "model_name is ignored for now"
- **Impact**: All benchmark scores were artificially similar (75-83 range)
- **Solution**: Implemented Unified Model Interface with proper model routing

### OpenAI Model API Requirements (Critical Configuration)

**GPT-5 Series (2025 Models)**:
```python
# Correct configuration for GPT-5 models
'gpt-5': {
    'max_completion_tokens': 4000,    # MUST use this, NOT max_tokens
    'temperature': None,               # Do NOT pass temperature (causes 400 error)
    'verbosity': 'medium',            # low/medium/high (GPT-5 specific)
    'reasoning_effort': 'minimal'     # minimal/low/medium/high
}
```
- **API Endpoints**: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- **Critical**: GPT-5 models reject temperature parameter entirely

**o1 Series (Reasoning Models)**:
```python
# Correct configuration for o1 models
'o1-mini': {
    'max_completion_tokens': 15000,   # Needs large token budget for reasoning
    'temperature': None,               # Not supported
    'top_p': 1.0,                     # Optional
    'reasoning_effort': 'medium'      # Controls reasoning depth
}
```
- **API Endpoints**: `o1`, `o1-mini` (o3-mini maps to o1-mini)
- **Hidden tokens**: Uses reasoning_tokens not visible in response but counted in billing

**GPT-4 Series (Standard Models)**:
```python
# Standard configuration
'gpt-4o': {
    'max_tokens': 500,                # Uses standard max_tokens
    'temperature': 0.7                # Normal temperature support
}
```

### Current OpenAI Model Test Results (2025-08-12)
All 11 OpenAI models successfully tested with correct API usage:

| Model | Score | Speed | Token Usage | Status |
|-------|-------|-------|-------------|--------|
| o1-mini | 0.890 | 5.27s | 746 | ✅ Best performance |
| gpt-4o-mini | 0.888 | 7.73s | 389 | ✅ Best value |
| gpt-4.5 | 0.883 | 10.91s | 420 | ✅ Recommended |
| o3-mini | 0.879 | 6.51s | 1003 | ✅ Working |
| gpt-4-turbo | 0.877 | 12.24s | 462 | ✅ Working |
| gpt-4o | 0.877 | 11.14s | 376 | ✅ Working |
| gpt-4 | 0.856 | 12.91s | 333 | ✅ Working |
| o1 | 0.834 | 6.65s | 405 | ✅ Working |
| gpt-5-nano | 0.759 | 4.11s | 526 | ✅ Fixed |
| gpt-5-mini | 0.713 | 10.73s | 811 | ✅ Fixed |
| gpt-5 | 0.704 | 16.14s | 1144 | ✅ Fixed |

### Testing OpenAI Models
```bash
# Run comprehensive OpenAI model benchmark
cd wenxin-backend && python openai_benchmark.py

# Results saved to:
# - openai_benchmark_results.json (detailed test results)
# - openai_model_scores.json (model performance scores)  
# - openai_benchmark_report.md (markdown summary)
```

## Test Accounts
- Demo: username=`demo`, password=`demo123`
- Admin: username=`admin`, password=`admin123`