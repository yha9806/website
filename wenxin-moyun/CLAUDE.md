# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WenXin MoYun - Modern AI art evaluation platform with **complete iOS design system**. Full-stack application with React 19 frontend featuring **pure iOS-style interface**, and FastAPI backend with dual authentication (JWT + guest mode), async AI evaluation engine, and real-time progress visualization.

### Complete iOS Design System Migration (2025-08-11) ✨

🎉 **MIGRATION COMPLETE**: Successfully completed **total transformation** from traditional Chinese aesthetics to **modern iOS design system**:

- ✅ **Typography System**: iOS San Francisco font stack, iOS spacing ratios, modern readability
- ✅ **Component System**: Complete IOSButton, IOSCard, IOSToggle, IOSSlider, IOSAlert integration
- ✅ **Color System**: Pure iOS system colors (Blue #007AFF, Green #34C759, Orange #FF9500)
- ✅ **Layout & Backgrounds**: iOS-style glass morphism, clean gradients, subtle textures
- ✅ **Homepage Redesign**: Modern English interface with iOS visual language
- ✅ **Legacy Cleanup**: Removed Chinese fonts, traditional animations, decorative elements

**Current Design Philosophy** (Updated 2025-08-16):
- **Pure iOS Visual Language**: Authentic Apple design system implementation
- **Modern International Interface**: English-first, globally accessible design
- **Clean Minimalism**: Removed ornamental elements, focused on functionality
- **Glass Morphism**: Native iOS-style transparency and backdrop blur effects
- **60+ Fluent Emojis**: Semantic emoji system for intuitive interactions
- **Performance Optimized**: Removed heavy animations, optimized for smooth experience

## Essential Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173 (or next available port)

# Build & Production
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint checks

# Testing (Playwright E2E)
npm run test:e2e              # Run E2E tests headless
npm run test:e2e:ui           # Run tests with UI mode
npm run test:e2e:debug        # Debug tests step by step
npm run test:e2e:headed       # Run tests in headed browser
npm run test:e2e:report       # Show test report
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript 5.8
- **Build**: Vite 7.1 
- **Styling**: Tailwind CSS 4.1 with **pure iOS design tokens**
- **Design System**: **Complete iOS Component System** with Fluent Emoji integration
- **Routing**: React Router DOM 7.8
- **State Management**: Zustand 4.4 (lightweight store)
- **Animations**: Framer Motion 12.23 (iOS spring physics)
- **Charts**: Recharts 3.1
- **Icons**: Microsoft Fluent Emoji (60+ SVG)
- **Testing**: Playwright (E2E testing framework)

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
       └── iOS Components (src/components/ios/)
            ├── Core Components (IOSButton, IOSCard, IOSToggle, IOSSlider, IOSAlert)
            ├── Emoji System (EmojiIcon, StatusEmoji, RankEmoji, TypeEmoji)
            ├── Utils (iosTheme.ts, animations.ts, emojiMap.ts)
            └── Adapter Layer (ChineseButton → IOSButton compatibility)
       └── Feature Components (evaluation/, auth/, charts/)
            └── Legacy Components (being phased out)
```

## iOS Component System

### Core Components

**IOSButton** - Native iOS button with glass morphism and haptic feedback simulation
```typescript
<IOSButton 
  variant="primary" // primary | secondary | destructive | glass | text
  size="md"         // sm | md | lg
  emoji="like"      // Fluent Emoji integration
  glassMorphism={true}
  disabled={false}
>
  Button Text
</IOSButton>
```

**IOSCard** - Container with multiple variants and structured content
```typescript
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader 
    title="Card Title"
    subtitle="Optional subtitle"
    emoji={<TypeEmoji type="painting" size="lg" />}
    action={<StatusEmoji status="completed" animated />}
  />
  <IOSCardContent>
    <p>Card content goes here</p>
  </IOSCardContent>
  <IOSCardFooter>
    <IOSButton>Action</IOSButton>
  </IOSCardFooter>
</IOSCard>
```

**IOSToggle** - iOS-style switches with multiple colors and sizes
```typescript
<IOSToggle
  checked={value}
  onChange={setValue}
  color="green"     // primary | green | orange | red
  size="md"         // sm | md | lg
  label="Enable Feature"
  description="Detailed description"
/>
```

**IOSSlider** - Interactive value sliders with custom formatting
```typescript
<IOSSlider
  value={sliderValue}
  onChange={setSliderValue}
  min={0}
  max={100}
  step={1}
  color="primary"
  showValue={true}
  label="Volume"
  formatValue={(v) => `${v}%`}
/>
```

**IOSAlert** - Modal alerts with backdrop blur and native animations
```typescript
<IOSAlert
  visible={showAlert}
  onClose={() => setShowAlert(false)}
  type="info"       // info | success | warning | error
  title="Alert Title"
  message="Alert message text"
  actions={[
    { label: "Cancel", onPress: onCancel, style: "cancel" },
    { label: "Confirm", onPress: onConfirm, style: "default" }
  ]}
/>
```

### Emoji System

**Fluent Emoji Integration** - 60+ Microsoft Fluent Emoji SVGs with semantic categorization

```typescript
// Status-based emojis
<StatusEmoji status="pending" size="lg" animated />    // ⏱️
<StatusEmoji status="processing" size="md" />          // ⚙️
<StatusEmoji status="completed" size="sm" />           // ✅
<StatusEmoji status="failed" />                        // ❌

// Ranking emojis
<RankEmoji rank={1} size="lg" />                       // 🥇
<RankEmoji rank={2} size="md" />                       // 🥈
<RankEmoji rank={3} size="sm" />                       // 🥉

// Content type emojis
<TypeEmoji type="poem" size="lg" />                    // 📝
<TypeEmoji type="painting" size="md" />                // 🎨
<TypeEmoji type="music" size="sm" />                   // 🎵

// Generic emoji with animation
<EmojiIcon 
  category="actions" 
  name="like" 
  size="md" 
  animated 
  animationType="pulse" 
/>
```

### Theme System

**iOS Design Tokens** (`src/components/ios/utils/iosTheme.ts`)
```typescript
export const iosColors = {
  blue: '#007AFF',      // Primary iOS blue
  green: '#34C759',     // Success green
  orange: '#FF9500',    // Warning orange
  red: '#FF3B30',       // Destructive red
  gray: '#8E8E93',      // Neutral gray
}

export const iosShadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
}
```

**iOS Animation Presets** (`src/components/ios/utils/animations.ts`)
```typescript
export const iosAnimations = {
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
  buttonTap: { scale: 0.96 },
  cardHover: { scale: 1.02, rotateX: -2 },
}
```

### Migration Patterns

**Backward Compatibility** - Seamless migration from Chinese components
```typescript
// Old usage (still works)
import { ChineseButton } from '../components/common/ChineseButton';

// New usage (recommended)
import { IOSButton } from '../components/ios';

// Adapter pattern ensures compatibility
export { IOSButton as ChineseButton } from './core/IOSButton';
```

### Test Page
Visit `/test-ios` to see comprehensive component demonstrations and interactive examples.

## Critical Implementation Details

### React 19 Compatibility
- Uses native `crypto.randomUUID()` for guest session IDs
- Compatible with strict TypeScript 5.8 configuration
- Leverages React 19's improved concurrent features

### Tailwind CSS v4 Setup
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]

// index.css - v4 import syntax
@import 'tailwindcss';  // NOT @tailwind directives
```

### State Management Architecture
- **Zustand stores**: UI state, filters, preferences
- **React hooks**: Custom hooks abstract business logic
- **Component state**: Local form state and UI interactions
- **Mock data**: Static data in `src/data/mockData.ts` for development

### Responsive Design System
- **Mobile-first**: 375px baseline with touch-friendly 44px targets
- **Breakpoints**: `md: 768px`, `lg: 1024px`, `xl: 1200px`
- **Dynamic orbs**: Floating background animations preserved across themes
- **Glass morphism**: Uses backdrop-blur and opacity layering

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

## Security Configuration & Credentials

### Google Cloud Platform Setup

**Project Information:**
- **Project Name**: `WenXin MoYun`
- **Project ID**: `wenxin-moyun-prod-new`
- **Region**: `asia-east1`
- **Service Name**: `wenxin-moyun`
- **Artifact Registry Repository**: `wenxin-images`

**GitHub Actions Service Account:**
- **Email**: `github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com`
- **Purpose**: Automated CI/CD deployment to Google Cloud Platform

**Required GCP IAM Roles:**
1. **Artifact Registry Administrator** - Create/manage Docker repositories
2. **Cloud Run Admin** - Deploy services to Cloud Run
3. **Cloud SQL Admin** - Manage database connections and migrations
4. **Secret Manager Secret Accessor** - Access API keys and secrets
5. **Storage Admin** - Deploy frontend to Cloud Storage

### GitHub Secrets Configuration

**Required Secrets in GitHub Repository:**
- `GCP_SA_KEY` - Google Cloud service account JSON key
- `OPENAI_API_KEY` - OpenAI API access token
- `ANTHROPIC_API_KEY` - Anthropic API access token
- `GEMINI_API_KEY` - Google Gemini API access token (optional)

### Google Cloud Secret Manager

**Secrets stored in GCP Secret Manager:**
- `db-password` - Database password for PostgreSQL
- `secret-key` - Application secret key for JWT tokens
- `openai-api-key` - OpenAI API key for AI model access
- `anthropic-api-key` - Anthropic API key for Claude models
- `gemini-api-key` - Google Gemini API key

### Test Accounts

**Development Environment:**
- **Demo Account**: `demo` / `demo123`
- **Admin Account**: `admin` / `admin123`

### Database Configuration

**Development (SQLite):**
```
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
```

**Production (PostgreSQL on Cloud SQL):**
```
DATABASE_URL=postgresql+asyncpg://wenxin:[PASSWORD]@/wenxin_db?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres
```

**Database Instance:**
- **Instance Name**: `wenxin-postgres`
- **Database Name**: `wenxin_db`
- **Username**: `wenxin`
- **Connection**: Cloud SQL Proxy via Unix socket

### Security Best Practices

1. **API Keys**: Stored in Google Cloud Secret Manager, never in code
2. **Database Passwords**: Generated and stored securely in Secret Manager
3. **Service Account Keys**: Minimal permissions, regularly rotated
4. **Environment Variables**: Production values injected at runtime
5. **CI/CD Security**: GitHub Actions uses OIDC authentication where possible

### Manual Setup Requirements

**First-time GCP Setup:**
```bash
# 1. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 2. Create service account
gcloud iam service-accounts create github-actions \
    --description="GitHub Actions CI/CD" \
    --display-name="GitHub Actions"

# 3. Grant roles
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# 4. Create key for GitHub Secrets
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com
```

**Secret Creation:**
```bash
# Create secrets in Secret Manager
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-
echo -n "your-secret-key" | gcloud secrets create secret-key --data-file=-
echo -n "your-openai-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-anthropic-key" | gcloud secrets create anthropic-api-key --data-file=-
```

### Common Issues & Solutions

**Secret Manager Access Issues:**
- Ensure project ID (not numeric ID) is used in gcloud commands
- Verify service account has `secretmanager.secretAccessor` role
- Check secret exists with correct name

**Artifact Registry Permission Denied:**
- Service account needs `artifactregistry.admin` role
- Repository must exist before Docker push
- Use correct registry format: `REGION-docker.pkg.dev/PROJECT/REPO/IMAGE`

**Cloud SQL Connection Issues:**
- Verify Cloud SQL instance is running
- Check Cloud SQL Admin API is enabled
- Ensure connection string uses correct Unix socket path

## File Path References

Key files for understanding the codebase:
- Application entry: `src/App.tsx`
- Type definitions: `src/types/types.ts`
- Mock data: `src/data/mockData.ts`
- Tailwind config: `tailwind.config.js`
- GitHub Actions: `.github/workflows/deploy-gcp.yml`
- GCP Automation: `gcp-automation.cjs`