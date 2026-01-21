# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VULCA (Visual Understanding and Linguistic Cultural Assessment) - AI model benchmarking platform testing 42 models from 15 organizations across 47 evaluation dimensions and 8 cultural perspectives. Features React 19 frontend with iOS design system, FastAPI backend with async SQLAlchemy, and production GCP deployment.

**Production URLs:**
- Frontend: https://vulcaart.art (Firebase Hosting)
- Backend API: https://wenxin-moyun-api-229980166599.asia-east1.run.app (Cloud Run)
- Database: Supabase PostgreSQL (free tier)
- Demo Booking: https://cal.com/vulcaart/demo (Cal.com)

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

# Vite Cache Issues
npm run dev:clean       # Clear cache and start dev server
npm run dev:fresh       # Complete cache reset and start
npm run cache:clear     # Clear all caches (manual)

# Playwright E2E Testing (64 test cases)
npm run test:e2e               # Run all tests headless
npm run test:e2e:ui            # Interactive test UI
npm run test:e2e:debug         # Debug mode step-by-step
npm run test:e2e:headed        # Run in visible browser
npm run test:e2e:report        # Show HTML test report
npm run test:e2e -- --grep="auth"  # Run specific test pattern
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
python test_qwen_complete.py --priority  # Test 6 priority Qwen models
python test_anthropic_final.py          # Test Claude models
python merge_all_results_v2.py          # Merge all test results
```

## Architecture Patterns

### Frontend Architecture

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

#### HashRouter (Required for Cloud Storage)
```typescript
// All routes use hash: #/, #/leaderboard, #/battle, #/model/:id, #/vulca
const withRoute = (path: string): string => {
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};
```

#### State Management
- **Zustand**: For global UI state and preferences
- **Custom Hooks**: Business logic abstraction (useVULCAData, useAuth, etc.)
- **React State**: Component-level state management

#### 3D Visualization (VULCA Page)
- **React Three Fiber**: 3D rendering with @react-three/fiber + @react-three/drei
- **Three.js**: WebGL-based 3D graphics for interactive background
- Key file: `src/components/vulca/VULCAVisualization.tsx`

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
app/vulca/core/vulca_core_adapter.py  # 6D→47D expansion algorithm
app/vulca/services/vulca_service.py   # Async business logic
app/vulca/models/                     # SQLAlchemy models
app/vulca/schemas/                    # Pydantic schemas
app/vulca/vulca.py                    # FastAPI endpoints (8 routes)
```

## Critical Development Patterns

### VULCA 47D Dimension Names Issue
When working with VULCA dimension names in visualization:
- Dimensions come in various formats: snake_case (creative_synthesis), camelCase (CreativeSynthesis), or with spaces (Creative Synthesis)
- The VULCAVisualization component requires special handling:
  ```typescript
  // Helper function to convert camelCase to spaced format
  const camelCaseToWords = (text: string): string => {
    return text.replace(/([a-z])([A-Z])/g, '$1 $2')
             .replace(/^[a-z]/, c => c.toUpperCase());
  };
  ```
- Key files: `src/components/vulca/VULCAVisualization.tsx`, `src/utils/vulca-dimensions.ts`

### Vite Module Export Errors
When encountering "The requested module does not provide an export named 'XXX'":
1. First try: `npm run dev:clean`
2. If persists: `npm run dev:fresh`
3. Last resort: Clear caches manually and restart

### TypeScript Module Resolution
When Vite module errors occur, define types locally as temporary workaround:
```typescript
// Temporary fix: define types locally
interface VULCAScore6D {
  creativity: number;
  technique: number;
  emotion: number;
  context: number;
  innovation: number;
  impact: number;
}
```

### NULL Score Handling
```typescript
// Image models have intentional NULL scores
{score != null ? score.toFixed(1) : 'N/A'}
```

## Common Deployment Issues

### Port Binding
- Check `${PORT:-8080}` environment variable
- Bind to `0.0.0.0` not localhost

### Database Migrations
```bash
alembic upgrade head  # NOT alembic stamp
# Run via Cloud Run Jobs, not inline
```

### Package Versions
Always use constraints.txt for Python dependencies

### Missing Columns
Run proper alembic upgrade, not manual schema changes

## Test Accounts
- Demo: `demo` / `demo123`
- Admin: `admin` / `admin123`

## External Services

### Cal.com (Demo Booking)
- Account: `vulcaart` (yuhaorui48@gmail.com)
- Public Link: https://cal.com/vulcaart/demo
- Used in: `src/pages/BookDemoPage.tsx`
- Duration: 30 minutes, Cal Video conferencing

## GCP Configuration
- Project ID: `wenxin-moyun-prod-new`
- Region: `asia-east1`
- Services: Cloud Run, Firebase Hosting, Secret Manager
- Artifact Registry: `asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images`
- Database: Supabase PostgreSQL (replaced Cloud SQL for cost savings)
- Domain: vulcaart.art (Firebase Hosting custom domain)

## Critical Dependency Issues

### bcrypt Version Compatibility
```python
# requirements.txt - MUST use bcrypt 4.0.x
bcrypt==4.0.1  # 4.1+ breaks passlib compatibility
```
The passlib library is incompatible with bcrypt 4.1+. Always pin to 4.0.x.

### Hash Router SEO Implications
The frontend uses HashRouter (`#/pricing`, `#/product`) required for static hosting. This affects:
- Google cannot directly crawl hash URLs
- Must manually request indexing via Google Search Console
- Sitemap includes hash URLs but crawling is limited

## Exhibition Module (Didot Exhibition)

### Overview
Echoes and Returns (回响与归来) - AI dialogue generation system for 87 contemporary artworks. Generates multi-persona art criticism dialogues with multimodal (image+text) analysis.

### Commands
```bash
cd wenxin-backend
# Generate multimodal dialogues (all 87 artworks)
python3 scripts/generate_multimodal_dialogues.py --participants 3 --turns 6 --images 3

# Check progress
cat data/exhibition/multimodal_progress.json
```

### Architecture
```
wenxin-backend/app/exhibition/
├── models/
│   ├── persona.py          # 8 historical personas (苏轼, 郭熙, Ruskin, etc.)
│   └── dialogue.py         # Dialogue data models
├── services/
│   ├── multi_agent_generator.py  # Core VLM dialogue generation
│   ├── lancedb_service.py        # Vector database service
│   └── image_processor.py        # Aliyun OSS image handling
└── api/
    └── exhibition_routes.py      # REST API endpoints
```

### Data Paths
- **Source data**: `Didot_exhibition_Dec/Echoes and Returns.json`
- **Generated dialogues**: `Didot_exhibition_Dec/dialogues.json`
- **LanceDB storage**: `wenxin-backend/data/exhibition/`
- **GitHub Raw URL**: `https://raw.githubusercontent.com/yha9806/website/003-ji-vulca-vulca/Didot_exhibition_Dec/dialogues.json`

### Key Parameters
- Dialogue content: 1-20 characters per turn
- Participants: 3 personas per dialogue
- Turns: 6 per dialogue
- Languages: EN/ZH/JA/RU
- Multimodal: Image analysis via Claude Vision API

## Task Management System

The project uses a structured task management system:
```
tasks/
├── active/       # Currently active tasks
├── completed/    # Finished tasks with full documentation
└── suspended/    # Paused tasks
```

When working on complex tasks, document in markdown format with sections for requirements, constraints, implementation plan, and progress tracking.

## Database Initialization

The `init_db.py` script creates both admin and demo users:
```bash
cd wenxin-backend
python init_db.py  # Creates admin/admin123 and demo/demo123
```

For production (Supabase), the CI/CD pipeline runs this automatically via GitHub Actions.

## Deployment Pipeline

### GitHub Actions Workflow (.github/workflows/deploy-gcp.yml)
1. **Test Phase**: Frontend build, backend tests, Playwright E2E (64 tests)
2. **Database Init**: Runs `init_db.py` against Supabase
3. **Backend Deploy**: Docker build → Artifact Registry → Cloud Run
4. **Frontend Deploy**: Vite build → Firebase Hosting

### Firebase Hosting Commands
```bash
cd wenxin-moyun
npm run build
firebase deploy --only hosting
```

### Environment Variables (Cloud Run)
Secrets are injected from GCP Secret Manager:
- `DATABASE_URL`: Supabase connection string
- `SECRET_KEY`: JWT signing key
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`: AI provider keys