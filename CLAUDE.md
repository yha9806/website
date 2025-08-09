# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - AI art creation evaluation platform that combines traditional Chinese aesthetics with modern AI technology. Full-stack application with React 19 frontend featuring artistic Chinese-style visual design, and FastAPI backend with dual authentication (JWT + guest mode), async AI evaluation engine, and real-time progress visualization.

## Essential Commands

### Quick Start (Windows)
```bash
start.bat                                              # One-click startup (recommended)

# Or manual startup in separate terminals:
cd wenxin-backend && python init_db.py                # Initialize database (first time only)
cd wenxin-backend && python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev                        # Frontend (auto-increments port from 5173)
```

### MCP Server Management
```bash
claude mcp list                                       # Check MCP server status
claude mcp add playwright npx @playwright/mcp@latest  # Add Playwright MCP
claude mcp get <name>                                 # Get MCP server details
claude mcp remove <name>                              # Remove MCP server
```

### Frontend (wenxin-moyun)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (auto-increments port from 5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint validation
npm run preview      # Preview production build
npx vite build       # Build without TypeScript check if needed
```

### Backend (wenxin-backend)
```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data
pytest                                                 # Run all tests
pytest tests/test_auth.py -v                         # Run specific test verbose
pytest -k "test_login" -v                            # Run tests matching pattern
```

### Testing with MCP Tools
```bash
# Visual regression testing with Playwright MCP
# (Use Playwright MCP tools in Claude Code to automate browser testing)

# Design validation with Figma MCP  
# (Requires FIGMA_PERSONAL_ACCESS_TOKEN environment variable)
```

### Database Operations
```bash
cd wenxin-backend
rm wenxin.db                    # Delete existing database
python init_db.py               # Recreate with new schema + sample data
```

### Windows Process Management
```bash
netstat -ano | findstr :8001                         # Check what's using port 8001
netstat -ano | findstr :517                          # Check all ports 5173-5179
taskkill /F /PID <PID>                              # Kill specific process
cmd /c "taskkill /F /PID 12345"                     # Kill process with cmd wrapper
wmic process where "name='python.exe'" delete        # Kill all Python processes
```

### Vite Cache Management
```bash
cd wenxin-moyun && rm -rf node_modules/.vite        # Clear Vite cache
```

## Tech Stack Summary

### Frontend
- **React 19.1** + **TypeScript 5.8** + **Vite 7.1**
- **Tailwind CSS 4.1** (with custom artistic theme)
- **Zustand 4.4** for state management
- **Framer Motion 12.23** for animations
- **@tanstack/react-table v8** for data tables
- **Recharts 3.1** for data visualization

### Backend  
- **FastAPI 0.109** + **Python 3.9+**
- **SQLAlchemy 2.0** async ORM
- **Pydantic v2** for validation
- **JWT** + Guest session authentication
- **LangChain 0.1** (prepared but unused)

## Architecture Overview

### Three-Layer Architecture
```
Frontend (React 19/TypeScript)     Backend (FastAPI/Python)      Database (SQLite/PostgreSQL)
        ↓                               ↓                              ↓
    Components                      Routers                        Tables
        ↓                               ↓                              ↓
    Custom Hooks                   Services/Deps                  - users
        ↓                               ↓                          - ai_models
    Service Layer                  Pydantic Schemas               - battles
        ↓                               ↓                          - battle_votes
    Axios Client                   SQLAlchemy Models              - artworks
        ↓                               ↓                          - evaluation_tasks
    API Calls ──────────────→     Async Handlers                 - evaluation_results
```

### Visual Design System (Artistic Chinese Style)

**Design Philosophy**: Combines modern artistic creativity with traditional Chinese aesthetics
- **Background**: Dynamic ink-wash gradient effects with floating orbs
- **Color Palette**: Traditional Chinese colors (朱红, 金黄, 翡翠绿) + modern gradients
- **Typography**: Serif fonts for Chinese text, maintaining calligraphy feel
- **Animations**: Floating water-ink effects (20-30s loops)
- **3D Effects**: Perspective transforms, hover rotations, depth shadows

**Key Visual Components**:
```typescript
// Layout.tsx - Multi-layer background system
- Fixed gradient base (slate-50 → rose-50 → indigo-50)
- Animated floating orbs with blur effects
- Chinese pattern overlay (subtle wave patterns)

// Color System (tailwind.config.js)
- Intelligent color scale generation (50-900)
- Traditional Chinese colors: chinese.red, chinese.gold, chinese.jade
- HSL-based dynamic color generation preserving main brand colors
```

### Backend Service-Oriented Architecture
**Core Services:**
- `EvaluationEngine`: Manages async evaluation task processing with progress tracking
- `MockProvider`: Simulates AI model interactions for development/testing
- `ScoringAdvisor`: Provides task-specific evaluation guidance and scoring templates
- `AuthenticationSystem`: Handles dual authentication (JWT + Guest sessions)

**Data Flow Pattern:**
```python
API Request → Router → Dependencies (Auth/DB) → Service Layer → SQLAlchemy Model → Database
            ↓
Background Task → EvaluationEngine → MockProvider → Database Update
```

### Frontend Component Architecture
**Hook-Based Service Pattern:**
```typescript
Component (e.g., EvaluationsPage.tsx)
    ↓ uses
Custom Hook (e.g., useEvaluations.ts)
    ↓ calls
Service Layer (e.g., evaluations.service.ts)
    ↓ uses
Axios Instance (api.ts with interceptors)
    ↓ requests
Backend API (/api/v1/*)
```

**State Management:**
- **Zustand Stores**: UI state (view modes, sort options), filter state
- **React State**: Component-local state, form state  
- **Custom Hooks**: Business logic abstraction, API state management

## Critical Implementation Details

### Dual Authentication Architecture
Platform supports both authenticated users and anonymous guest sessions:

**Frontend Guest Session Management:**
```typescript
// Uses native crypto.randomUUID() for React 19 compatibility
const guestSession = {
  id: crypto.randomUUID(),
  dailyUsage: 0,
  lastReset: new Date().toDateString(),
  evaluations: []
};

// Guest headers sent with each API request
const guestHeaders = { 'X-Guest-ID': session.id };
```

**Backend Mixed Authentication:**
```python
# app/api/deps.py - Critical dependency pattern
async def get_current_user_or_guest(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Union[User, GuestSession]:
    # Try JWT first, fallback to guest session
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # JWT token validation
    else:
        guest_id = request.headers.get("x-guest-id") or str(uuid.uuid4())
        return GuestSession(guest_id)
```

### Visual System CSS Architecture
**Animation Classes (index.css):**
```css
/* Water-ink animations */
@keyframes float { /* 20s floating motion */ }
@keyframes float-delayed { /* 25s with 5s delay */ }
@keyframes float-slow { /* 30s with 10s delay */ }

.animate-float, .animate-float-delayed, .animate-float-slow
.bg-gradient-radial { /* Radial gradient support */ }
```

**Component Style Classes:**
```css
.card { /* Glass morphism with backdrop blur */ }
.btn-primary, .btn-secondary { /* Gradient buttons with 3D transforms */ }
.text-h1 through .text-caption { /* Typography system */ }
```

### Database Schema Design
**Dynamic ID Support** for SQLite/PostgreSQL compatibility:
```python
# Models support both database types
if settings.DATABASE_URL.startswith("sqlite"):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
else:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

### API Data Format Patterns
**URL Requirements:**
```typescript
// FastAPI requires trailing slashes to avoid 307 redirects
await apiClient.get('/models/');    // ✓ Correct
await apiClient.get('/models');     // ✗ Causes 307 redirect
```

### React 19 Specific Requirements
**UUID Generation:**
```typescript
// ✓ Use native crypto API
const id = crypto.randomUUID();

// ✗ Avoid uuid package (causes peer dependency conflicts)
import { v4 as uuidv4 } from 'uuid';
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - OAuth2 form-data login (returns JWT)
- `POST /api/v1/auth/register` - User registration

### Core Resources (all require trailing slashes)
- `/api/v1/models/` - AI model management
- `/api/v1/battles/` - Battle system with voting
- `/api/v1/artworks/` - Creative works
- `/api/v1/evaluations/` - AI evaluation tasks (supports guest mode)
- `/api/v1/evaluations/{id}/progress` - Real-time progress tracking
- `/api/v1/evaluations/{id}/scoring-advice` - AI scoring recommendations
- `/api/v1/leaderboard/` - Model rankings

### Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

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
USE_REDIS=False                    # Simplified deployment
USE_QDRANT=False                  # No vector database
```

## Development Patterns & Conventions

### Project Structure
```
wenxin-moyun/               # Frontend React app
├── src/
│   ├── components/         # UI components (common/, charts/, filters/, etc.)
│   ├── pages/             # Route-level components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── store/             # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions

wenxin-backend/            # Backend FastAPI app
├── app/
│   ├── api/v1/           # API endpoints
│   ├── core/             # Core configuration
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   └── services/         # Business logic
```

### Adding New Features
1. **Backend**: Model → Schema → Router → Service → Register in `__init__.py`
2. **Frontend**: Types → Service → Hook → Component → Route → UI Integration

### Visual Component Development
When creating new UI components:
1. Use existing color scales from `tailwind.config.js` (neutral, primary, accent, etc.)
2. Apply glass morphism effects for cards: `bg-neutral-50/80 backdrop-blur-xl` 
3. Add hover animations: `whileHover={{ scale: 1.02, rotateX: -5 }}`
4. Use gradient text for headings: `bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent`
5. **Important**: Use `neutral-50` instead of `white` for Tailwind v4 compatibility

### SQLAlchemy Best Practices
```python
from sqlalchemy.orm import selectinload
query = select(EvaluationTask).options(
    selectinload(EvaluationTask.model),
    selectinload(EvaluationTask.user)
)
```

### TypeScript Build Configuration
```bash
# If TypeScript errors during build:
npx vite build                    # Build without TypeScript check
# Or modify tsconfig.app.json:
"noUnusedLocals": false,
"noUnusedParameters": false,
```

## Test Accounts
- **Demo User**: username=`demo`, password=`demo123`
- **Admin User**: username=`admin`, password=`admin123`

## System Status & Limitations

### Operational Components
- Frontend: React 19 + TypeScript + Tailwind CSS 4.1 + Framer Motion
- Backend: FastAPI + SQLAlchemy async + SQLite + Background Tasks
- Visual System: Artistic Chinese design with dynamic animations
- Authentication: Dual mode (JWT + Guest sessions with daily limits)
- MCP Integration: Playwright MCP for browser automation, Figma MCP for design integration

### Known Limitations
- **Mock AI Provider Only**: No real LLM integration
- **SQLite Database**: No migration system
- **No Real-time Updates**: Uses polling instead of WebSocket
- **Guest Limits**: 3 evaluations per day for anonymous users

## Troubleshooting Guide

### Port Conflicts
Frontend auto-increments ports if occupied:
```bash
# Check all potentially used ports
netstat -ano | findstr :517
# Typical sequence: 5173 → 5174 → 5175 → 5176 → 5177 → 5178 → 5179 → 5180 → 5181
```

### CORS Configuration Updates
When frontend starts on a new port, update backend CORS:
1. Edit `wenxin-backend/app/main.py`
2. Add new port to `cors_origins` list (both localhost and 127.0.0.1)
3. Backend auto-reloads with new configuration

### Visual System Not Updating
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Kill all old dev servers
3. Access the latest port (check console output)
4. Force refresh browser: `Ctrl + F5`

### API Authentication Issues
If `/api/v1/evaluations/` returns 401:
1. Verify `X-Guest-ID` header is sent
2. Check `oauth2_scheme` has `auto_error=False`
3. Restart FastAPI server completely

### Windows-Specific Issues
- Use `python -m uvicorn` instead of `uvicorn` directly
- Kill processes: `cmd /c "taskkill /F /PID <PID>"`
- Reserved device names (nul, con, aux) in .gitignore

### Build Errors
- TypeScript errors: Use `npx vite build` to bypass
- Tailwind CSS errors: Check for missing utility classes, use `neutral-50` instead of `white`
- React 19 conflicts: Ensure no uuid package dependency, use `--legacy-peer-deps` for npm installs

### Docker Deployment
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment  
docker-compose -f docker-compose.prod.yml up
```

## MCP Integration Configuration

### Currently Configured MCP Servers
1. **Playwright MCP**: Browser automation and testing
   - Command: `npx @playwright/mcp@latest`
   - Use for E2E testing, visual regression, performance monitoring
   
2. **Figma MCP**: Design system integration
   - Command: `node C:\Users\MyhrDyzy\AppData\Roaming\npm\node_modules\figma-mcp\dist\index.cjs`
   - Requires FIGMA_PERSONAL_ACCESS_TOKEN environment variable

### MCP Usage Examples
```javascript
// Playwright: Automated testing
await browser.navigate('http://localhost:5181');
await browser.click('text=开始评测');
await browser.snapshot();  // Capture accessibility tree

// Figma: Design token extraction
await figma.add_figma_file('your-figma-url');
await figma.view_node('file_key', 'node_id');
```