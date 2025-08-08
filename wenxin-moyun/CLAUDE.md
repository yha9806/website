# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

文心墨韵 (Wenxin Moyun) - An AI art creation capability evaluation platform that specializes in assessing AI models' creativity, aesthetic value, and cultural compatibility in poetry, painting, and narrative arts.

## Essential Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173 (or next available port)

# Build & Production
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint checks
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript 5.8
- **Build**: Vite 7.1 
- **Styling**: Tailwind CSS 4.1 with custom theme (primary/secondary colors)
- **Routing**: React Router DOM 7.8
- **Animations**: Framer Motion 12.23
- **Charts**: Recharts 3.1
- **Icons**: Lucide React

### Core Type System

All types are defined in `src/types/types.ts`. Key interfaces:
- `Model`: AI model with metrics, works, and metadata
- `ModelMetrics`: 6 evaluation dimensions (rhythm, composition, narrative, emotion, creativity, cultural)
- `Battle`: Model comparison and voting system
- `LeaderboardEntry`: Ranking data with win rates

**Important**: Always use `import type` for TypeScript types to avoid runtime issues.

### Component Architecture

```
Layout (wraps all pages with Header/Footer)
  └── Pages (route-level components)
       └── Feature Components (leaderboard/, model/, battle/)
            └── Common Components (shared UI elements)
```

### Routing Structure

- `/` - Home page with platform overview
- `/leaderboard[/:category]` - Rankings (overall/poetry/painting/narrative/etc)
- `/model/:id` - Model detail with radar chart and works
- `/battle` - Head-to-head voting system
- `/about` - Platform mission and roadmap

### Data Flow

Currently using static mock data (`src/data/mockData.ts`). No state management library yet - uses React local state and prop drilling. Data structure is designed to easily transition to API integration.

### Styling Approach

- Tailwind CSS with custom configuration
- Custom utility classes: `gradient-text`, `glass-effect`
- Dark mode CSS classes prepared (not togglable yet)
- Responsive grid system with mobile-first approach

## Common Development Patterns

### Adding New Models
Edit `src/data/mockData.ts` and add to `mockModels` array with all required fields per `Model` interface.

### Creating New Pages
1. Add page component in `src/pages/`
2. Add route in `App.tsx`
3. Update navigation in `Header.tsx` if needed

### Component Conventions
- Use functional components with TypeScript
- Props interfaces defined inline or in component file
- Framer Motion for page transitions
- Tailwind classes for styling (no separate CSS files)

## Known Issues & Solutions

### Module Import Errors
If you encounter "module does not provide export" errors:
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Use `import type` for TypeScript types
3. Restart dev server

### Port Conflicts
Dev server auto-increments ports if 5173 is taken. Check console output for actual port.

### PostCSS/Tailwind Issues
Configuration uses `@tailwindcss/postcss` plugin. If CSS errors occur, verify `postcss.config.js` has correct plugin path.

## Project Goals & Roadmap

**Current Phase**: MVP with static data
- ✅ Leaderboard system
- ✅ Model comparison
- ✅ Responsive design

**Next Phases**:
- API integration
- User authentication
- Automated evaluation system
- Community gallery

## File Path References

Key files for understanding the codebase:
- Application entry: `src/App.tsx`
- Type definitions: `src/types/types.ts`
- Mock data: `src/data/mockData.ts`
- Tailwind config: `tailwind.config.js`