# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - AI model benchmarking platform testing 25+ models from OpenAI, Anthropic, DeepSeek, and Qwen. Features React 19 frontend with iOS design system, FastAPI backend, and GCP deployment.

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
npm run test:e2e               # Playwright tests (64 cases)
npm run test:e2e:ui            # Interactive test UI
```

### Backend (wenxin-backend/)
```bash
pip install -r requirements.txt -c constraints.txt  # ALWAYS use constraints
python -m uvicorn app.main:app --reload --port 8001
python init_db.py              # Reset DB with 42 models
pytest tests/test_auth.py -v   # Run specific test
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

### Frontend HashRouter (Required for Cloud Storage)
```typescript
// All routes use hash: #/, #/leaderboard, #/battle, #/model/:id
const withRoute = (path: string): string => {
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};
```

### Backend OAuth2 Authentication
```typescript
// Must use form-urlencoded, NOT JSON
const formParams = new URLSearchParams();
formParams.append('username', username);
formParams.append('password', password);
```

### Unified Model Interface
```python
# Different models require different parameters
'gpt-5': max_completion_tokens=500  # NOT max_tokens
'o1': # No system messages, no temperature
'deepseek-chat': # Use for R1/R1-distill/V3, NOT deepseek-reasoner
'claude-opus-4-1-20250805': # No temperature AND top_p together
```

### NULL Score Handling
```typescript
// Image models have intentional NULL scores
{score != null ? score.toFixed(1) : 'N/A'}
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
- Bind to `0.0.0.0` not localhost
- Use `${PORT:-8080}` environment variable

### Database Migrations
```bash
alembic upgrade head  # NOT alembic stamp
# Run via Cloud Run Jobs, not inline
```

### Common Issues
1. **Port binding**: Check `${PORT:-8080}` and `0.0.0.0` binding
2. **Package versions**: Always use constraints.txt
3. **Missing columns**: Run proper alembic upgrade
4. **API auth failures**: Verify environment keys
5. **Claude 4.1 500 errors**: Use retry mechanism (test_claude_41_retry.py)

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`

## GCP Configuration
- Project ID: `wenxin-moyun-prod-new`
- Region: `asia-east1`
- Services: Cloud Run, Cloud Storage, Cloud SQL, Secret Manager

## Latest Benchmark Rankings (2025-08-20)
1. **gpt-5** (OpenAI): 88.5/100
2. **o1** (OpenAI): 88.3/100
3. **gpt-4o** (OpenAI): 87.3/100
4. **gpt-4.5** (OpenAI): 86.3/100
5. **gpt-4o-mini** (OpenAI): 86.0/100