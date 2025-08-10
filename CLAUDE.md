# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Full-stack AI art evaluation platform with **intelligent content generation and evaluation system**. Features React 19 frontend with iOS-style interface, FastAPI backend with dual authentication (JWT + guest mode), AI-powered evaluation engine, and automatic artwork creation from evaluations.

### System Architecture Status (2025-08-11)

- ✅ **Intelligent Scoring**: GPT-4 powered multi-dimensional content evaluation
- ✅ **Real Content Generation**: Replaced mock data with AI-generated content 
- ✅ **Advanced Caching System**: Multi-layer caching with TTL, LRU eviction, background refresh
- ✅ **iOS Component System**: Complete IOSButton, IOSCard, IOSToggle, IOSSlider, IOSAlert library
- ✅ **Error Handling**: React Error Boundaries with graceful fallbacks
- ✅ **Offline Mode**: Smart offline detection with cached data display
- ✅ **Async Evaluation Engine**: Background task processing with real-time progress
- ✅ **Automatic Artwork Creation**: Evaluation tasks generate gallery artworks
- ✅ **Media Storage System**: Local image storage for AI-generated images

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

# Development Helpers
# Ctrl+Shift+C in browser      # Toggle cache statistics panel (dev mode)
# Performance indicator shown in bottom-left (dev mode)
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
```

### Database Operations
```bash
cd wenxin-backend
rm wenxin.db                  # Delete existing database
python init_db.py             # Recreate with schema + sample data

# Alembic migrations (production)
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1
```

### Windows Process Management
```bash
netstat -ano | findstr :8001  # Check backend port
netstat -ano | findstr :517   # Check frontend ports 5173-5179
taskkill /F /PID <PID>        # Kill specific process
```

## High-Level Architecture

### Three-Layer Architecture
```
Frontend (React 19)          Backend (FastAPI)         Database (SQLite)
    ↓                           ↓                         ↓
iOS Components              API v1 Routers              Tables
    ↓                           ↓                         ↓
Custom Hooks               Service Layer               - users
    ↓                           ↓                    - ai_models
Axios Client ──────→      Async Handlers              - battles
                                                      - evaluations
                                                      - artworks
```

### Frontend Architecture (wenxin-moyun)

**Tech Stack:**
- React 19.1 + TypeScript 5.8 + Vite 7.1
- Tailwind CSS 4.1 (iOS design tokens)
- Framer Motion 12.23 (iOS spring animations)
- Zustand 4.4 (state management)
- Recharts 3.1 + D3.js (data visualization)
- TanStack Table 8.21 (data grids)
- Playwright (E2E testing)

**Component Hierarchy:**
```
src/
├── App.tsx                  # Main router and layout
├── pages/                   # Route-level components
├── components/
│   ├── ios/                # iOS 26 component system
│   │   ├── core/           # Base components (Button, Card, Toggle, etc.)
│   │   ├── utils/          # Theme, animations, emoji mapping
│   │   └── index.ts        # Public exports
│   ├── common/             # Shared components (Header, Footer, Layout)
│   ├── evaluation/         # Evaluation feature components
│   ├── leaderboard/        # Ranking system components
│   └── charts/             # Data visualization
├── hooks/                  # Custom React hooks
├── services/               # API client layer
├── types/                  # TypeScript definitions
└── data/                   # Mock data for development
```

### Backend Architecture (wenxin-backend)

**Tech Stack:**
- FastAPI 0.109 + Python 3.9+
- SQLAlchemy 2.0 (async ORM)
- Pydantic 2.5.3 (validation)
- JWT authentication + Guest sessions
- OpenAI GPT-4 + DALL-E 3 integration
- Background task processing with realistic progress simulation

**API Structure:**
```
app/
├── api/v1/                 # Versioned API routes
│   ├── auth.py            # JWT authentication
│   ├── models.py          # AI model CRUD
│   ├── artworks.py        # Gallery management with like/view endpoints
│   ├── evaluations.py     # Task creation & background execution
│   └── websocket_simple.py # Real-time updates
├── models/                # Database models (artworks, evaluation_tasks)
├── schemas/               # Pydantic validation schemas
├── services/              # Business logic layer
│   ├── evaluation_engine.py    # Core async evaluation processing
│   ├── intelligent_scoring/    # AI-powered content analysis
│   │   ├── ai_scorer.py        # GPT-4 evaluation engine
│   │   ├── content_analyzer.py # Multi-dimensional content analysis
│   │   └── quality_metrics.py  # Scoring algorithms
│   ├── ai_providers/           # Provider abstraction layer
│   │   ├── openai_provider.py  # OpenAI API integration
│   │   ├── mock_provider.py    # Development fallback
│   │   └── provider_manager.py # Multi-provider routing
│   └── media_storage/          # Local image storage system
└── static/generated_images/    # AI-generated image assets
```

## iOS 26 Liquid Glass System

### Core CSS Classes
```css
.ios-glass {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.7);
  border: 0.5px solid rgba(255, 255, 255, 0.3);
}

.liquid-glass-container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 100%);
  backdrop-filter: blur(40px) saturate(200%);
}

/* Dark mode adjustments */
.dark .ios-glass {
  background: rgba(30, 30, 30, 0.7);
  border-color: rgba(255, 255, 255, 0.1);
}
```

### Component Usage Examples

**IOSButton**
```typescript
<IOSButton 
  variant="primary"    // primary | secondary | destructive | glass | text
  size="md"           // sm | md | lg
  glassMorphism={true}
/>
```

**IOSToggle**
```typescript
<IOSToggle
  checked={value}
  onChange={setValue}
  color="green"       // primary | green | orange | red
  leftIcon={<Icon />}
  rightIcon={<Icon />}
/>
```

**IOSFilterPanel**
```typescript
<IOSFilterPanel
  config={filterConfig}
  values={filterValues}
  onChange={setFilterValues}
  showAdvanced={true}
  showWeights={true}
/>
```

## Critical Implementation Details

### Advanced Caching System
- **Multi-layer Architecture**: API Cache (5min TTL), Static Cache (30min TTL), Realtime Cache (30s TTL)
- **Intelligent Features**: Background refresh, stale-while-revalidate, LRU eviction
- **Cache Warming**: Automatic preloading of essential data on app startup
- **Development Tools**: Cache statistics panel accessible via Ctrl+Shift+C

### Error Handling & Resilience
- **React Error Boundaries**: App-level and page-level error catching with fallback UIs
- **Offline Mode**: Smart network detection with cached data display during outages
- **Graceful Degradation**: API failures fall back to cached or static data

### Performance Optimization
- **Device Detection**: Automatic performance tier detection (high/medium/low)
- **Dynamic Configuration**: Emoji sizing, animation complexity, blur effects adjust per device
- **GPU Acceleration**: Uses `translateZ(0)` and `will-change` for smooth animations

### React 19 Specifics
- Use `crypto.randomUUID()` instead of uuid package
- Use `import type` for TypeScript type imports
- Compatible with strict TypeScript 5.8 configuration

### Tailwind CSS v4
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]

// index.css
@import 'tailwindcss';  // v4 syntax, NOT @tailwind directives
```

### API Endpoints
Core endpoints and their purposes:
- `/api/v1/models/` - AI model management and metadata
- `/api/v1/evaluations/` - Create tasks, get progress, background execution
- `/api/v1/artworks/` - Gallery data with like/view/share interactions
- `/api/v1/auth/login/` - JWT authentication + guest sessions
- `/api/v1/battles/` - Model comparison and voting system

**Evaluation Flow:**
1. `POST /api/v1/evaluations/` - Creates task, triggers background processing
2. `GET /api/v1/evaluations/{id}/progress` - Real-time progress monitoring  
3. Task completion automatically creates artwork via `_create_artwork_from_evaluation()`
4. `GET /api/v1/artworks/` - Displays generated content in Gallery

API Documentation:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

### Guest Session Management
```typescript
// Frontend
const guestSession = {
  id: crypto.randomUUID(),
  dailyUsage: 0,
  lastReset: new Date().toDateString()
};

// Backend
async def get_current_user_or_guest():
    return validate_jwt() if auth_header else GuestSession(guest_id)
```

## Development Patterns

### Adding New Features
1. **Backend**: Model → Schema → Router → Service → Register in main.py
2. **Frontend**: Types → Service → Hook → Component → Route in App.tsx

### Component Migration Pattern
```typescript
// Legacy (still supported via adapter)
import { ChineseButton } from '../components/common/ChineseButton';

// Current
import { IOSButton } from '../components/ios';
```

### File Naming Conventions
- Components: PascalCase (`HomePage.tsx`)
- Utilities: camelCase (`performanceOptimizer.tsx`)
- Types: PascalCase interfaces (`interface Model`)

### State Management
- **Zustand**: Global UI state, filters, preferences
- **Advanced Caching**: Intelligent API response caching with background refresh
- **React hooks**: Business logic abstraction (useEvaluation, useGallery)
- **Component state**: Local form state and UI interactions
- **Real-time updates**: Background task progress via polling/WebSocket
- **Offline Support**: Cached data persistence for offline viewing

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

# AI Provider Keys
OPENAI_API_KEY=your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
HUGGINGFACE_API_KEY=your-hf-key-here

# Cost Control
ENABLE_COST_CONTROL=true
DAILY_COST_LIMIT=10.0
```

## Test Accounts
- Demo: username=`demo`, password=`demo123`
- Admin: username=`admin`, password=`admin123`

## Known Issues & Solutions

### Port Conflicts
Frontend auto-increments from 5173 if occupied. Check console for actual port.

### CORS Issues
Update `cors_origins` in `wenxin-backend/app/main.py` when frontend port changes.

### Performance Issues
Check performance indicator (bottom-left in dev mode). System auto-adjusts based on device tier.

### Build Errors
- TypeScript errors: Use `npx vite build` to bypass
- React 19 conflicts: Use `npm install --legacy-peer-deps`

### Module Import Errors
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Use `import type` for TypeScript types
3. Restart dev server
4. Check React 19 compatibility for dependencies

### Cache-Related Issues
- **Stale Data**: Use Ctrl+Shift+C to check cache status and clear if needed
- **Memory Issues**: Cache auto-evicts old entries using LRU algorithm
- **Network Failures**: Cache provides fallback data automatically

### Database Lock Errors
Delete `wenxin.db` and run `python init_db.py` to reset.

## Critical Architecture Components

### Core Services
- **Evaluation Engine**: `app/services/evaluation_engine.py` - Async task processing with realistic progress stages
- **Intelligent Scoring**: `app/services/intelligent_scoring/ai_scorer.py` - GPT-4 powered content evaluation
- **Provider Management**: `app/services/ai_providers/provider_manager.py` - Multi-provider AI routing system
- **Media Storage**: `app/services/media_storage/image_storage.py` - Local image storage for generated content

### Frontend Core Systems
- **Cache Management**: `src/utils/cache.ts` - Advanced multi-layer caching with TTL and LRU
- **Error Boundaries**: `src/components/common/ErrorBoundary.tsx` - App-level error handling
- **Offline Detection**: `src/services/api.ts` - Network error detection and fallback logic
- **Performance Optimizer**: `src/utils/performanceOptimizer.tsx` - Device-specific performance tuning

### Data Flow Architecture
```
Frontend Gallery Page → API Client → Artworks API → Database
     ↑                                                    ↑
Evaluation UI → Evaluation API → Background Tasks → Auto Artwork Creation
     ↓                              ↓
Progress Updates ← Task Progress ← Intelligent Scoring ← AI Providers
```

### Key Files
- **Backend Entry**: `app/main.py` - FastAPI app with CORS and static file serving
- **Frontend Entry**: `src/App.tsx` - React Router with iOS component system and Error Boundary
- **API Client**: `src/services/api.ts` - Axios client with caching, guest sessions, offline detection
- **Gallery Integration**: `src/pages/GalleryPage.tsx` - Real API data with caching, loading states, offline support
- **Cache System**: `src/utils/cache.ts` - Advanced caching with background refresh and LRU eviction
- **Database Init**: `init_db.py` - Sample data creation and schema setup

## Development Tools & Debugging

### Cache Statistics (Development Mode)
- **Keyboard Shortcut**: `Ctrl+Shift+C` to toggle cache stats panel
- **Live Metrics**: Hit rates, fresh/stale data counts, memory usage
- **Cache Controls**: Warm up and clear cache buttons
- **Performance Monitor**: Device performance level indicator (bottom-left)

### Error Handling Development
- **Error Boundaries**: Detailed error info in development, user-friendly in production
- **Console Logging**: Network errors, cache operations, performance metrics
- **Offline Simulation**: Test offline behavior by disabling network

### Testing & Quality Assurance
- **Playwright E2E**: Comprehensive browser automation tests
- **Cache Testing**: Verify cache behavior with network simulation
- **Error Testing**: Test error boundary behavior with intentional errors
- **Performance Testing**: Device performance tier simulation