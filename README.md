# VULCA — AI-Native Creation Organism

Create, critique, and evolve cultural art through multi-agent AI pipelines.

**VULCA** unifies generation, evaluation, and learning into one creative process. A multi-agent pipeline (Scout, Draft, Critic, Queen) creates culturally-aware art, scores it across L1-L5 dimensions, and evolves its understanding through each session.

**Live:** [vulcaart.art](https://vulcaart.art) | **Papers:** EMNLP 2025, WiNLP 2025, arXiv 2026

## Quick Start

### Docker (recommended)

```bash
docker-compose up
# Frontend: http://localhost:5173
# Backend:  http://localhost:8001
# No API keys needed — uses mock provider
```

### Manual

```bash
# Backend
cd wenxin-backend
pip install -r requirements.txt -c constraints.txt
python init_db.py                                    # Seed database
python -m uvicorn app.main:app --reload --port 8001

# Frontend (separate terminal)
cd wenxin-moyun
npm install --legacy-peer-deps
npm run dev
```

**Test accounts:** `demo` / `demo123` or `admin` / `admin123`

## Core Product: Canvas

The Canvas page is the product — a unified creation + evaluation playground.

```
Intent → Scout (cultural research) → Draft (image generation) → Critic (L1-L5 scoring) → Queen (accept/rerun)
```

### Features

- **Pipeline Editor** — Visual node graph (React Flow) for editing Scout→Draft→Critic→Queen topology
- **5 Modes** — Edit, Run, Build, Explore, Compare
- **12 Templates** — Standard Pipeline, Quick Evaluate, Batch, HITL, Brand Safety, etc.
- **Mock Provider** — Full pipeline works without API keys (generates placeholder images)
- **Human-in-the-Loop** — Pause at any stage for human review
- **SSE Streaming** — Real-time pipeline progress via Server-Sent Events
- **Cultural Traditions** — 8 traditions (Chinese Xieyi, Japanese Wabi-sabi, Persian Miniature, etc.)

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/prototype/runs` | POST | Create a pipeline run |
| `/api/v1/prototype/runs/{id}/events` | GET | SSE event stream |
| `/api/v1/prototype/runs/{id}/action` | POST | HITL action |
| `/api/v1/prototype/gallery` | GET | Gallery items (completed sessions) |
| `/api/v1/prototype/evolution` | GET | System evolution stats |
| `/api/v1/create` | POST | Quick evaluate (image upload) |

## Architecture

```
wenxin-moyun/          React 19 + TypeScript + Vite + Tailwind
  src/pages/prototype/   Canvas (PrototypePage) — THE PRODUCT
  src/pages/             Gallery, Home, Admin, Leaderboard (academic)
  src/components/ios/    Art Professional design system
  src/hooks/             usePrototypePipeline (SSE), useLeaderboard, etc.

wenxin-backend/         FastAPI + async SQLAlchemy
  app/prototype/
    agents/              Scout, Draft, Critic, Queen (+ providers)
    orchestrator/        PipelineOrchestrator (event-driven loop)
    session/             JSONL session store
    digestion/           ContextEvolver, FeatureExtractor, Clusterer
    cultural_pipelines/  8 tradition configs + weight tables
    api/                 REST endpoints for runs, gallery, evolution
  app/                   Auth, models CRUD, battles (academic legacy)
```

### Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript 5.8, Vite 7.1, Tailwind 4.1, Framer Motion |
| Backend | FastAPI, SQLAlchemy (async), LiteLLM, FAISS |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Design | Art Professional palette (warm tones, zero blue/purple) |
| Deployment | Docker, Cloud Run, Firebase Hosting |
| Testing | Playwright E2E (132 tests), pytest (824 tests) |

## Design System

Art Professional palette — gallery-inspired warm tones:

| Token | Color | Hex |
|-------|-------|-----|
| Primary | Slate Gray | `#334155` |
| Accent | Warm Bronze | `#C87F4A` |
| Success | Sage Green | `#5F8A50` |
| Warning | Amber Gold | `#B8923D` |
| Error | Coral Red | `#C65D4D` |

Zero blue/purple/indigo/violet in the entire codebase.

## Navigation

**Primary:** Canvas, Gallery, About
**More dropdown:** Models, Leaderboard, Exhibitions, Research, Solutions, Pricing, Trust

The Leaderboard and Battle pages are academic references from EMNLP papers — preserved but not the product focus.

## Environment Variables

Copy `.env.example` to `.env`:

```env
DEMO_MODE=true                                          # No API keys needed
SECRET_KEY=demo-secret-key-for-local-dev-only-32chars
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db

# Optional (for real AI generation)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

## Testing

```bash
# Backend (824 tests)
cd wenxin-backend && pytest tests/ -v

# Frontend type check + build
cd wenxin-moyun && npm run build

# E2E (132 tests)
cd wenxin-moyun && npm run test:e2e
```

## Deployment

Production deploys via GitHub Actions on push to `master`:

1. Test phase: frontend build + backend pytest + Playwright E2E
2. Backend: Docker build -> Artifact Registry -> Cloud Run
3. Frontend: Vite build -> Firebase Hosting

**Production URLs:**
- Frontend: https://vulcaart.art
- Backend: https://wenxin-moyun-api-229980166599.asia-east1.run.app
- API docs: `{backend}/docs`

## Research

| Paper | Venue | Contribution |
|-------|-------|-------------|
| VULCA Framework | EMNLP 2025 Findings | 5-dimension evaluation framework |
| VULCA-Bench | arXiv:2601.07986 | L1-L5 definition + 7,410 samples |
| Fire Imagery | WiNLP 2025 | Cultural symbol reasoning |
| Art Critique | arXiv:2601.07984 | Cross-cultural evaluation |

## License

MIT License. See [LICENSE](LICENSE).
