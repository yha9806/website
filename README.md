# WenXin MoYun - AI Art Evaluation Platform

[![Deploy to GCP](https://github.com/myhr-dev/website/actions/workflows/deploy-gcp.yml/badge.svg)](https://github.com/myhr-dev/website/actions/workflows/deploy-gcp.yml)

**Enterprise-grade AI art evaluation platform** supporting **42 AI models** from **15 organizations**. Full-stack application featuring complete iOS design system migration, real AI model benchmarking with **Unified Model Interface**, comprehensive E2E testing infrastructure, and **production Google Cloud Platform deployment**.

## 🚀 Quick Start

### One-click Development Setup

**Windows:**
```bash
start.bat    # Starts backend (:8001) + frontend (:5173)
```

**Linux/macOS:**
```bash
./start.sh   # Starts backend (:8001) + frontend (:5173)
```

### Manual Setup

**Frontend Development:**
```bash
cd wenxin-moyun
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173
```

**Backend Development:**
```bash
cd wenxin-backend
pip install -r requirements.txt
python init_db.py    # Initialize database with sample data
python -m uvicorn app.main:app --reload --port 8001
```

## 🏗️ Architecture Overview

### System Architecture
```
Frontend (React 19 + iOS Design)  ←→  Backend (FastAPI + SQLAlchemy)  ←→  AI Providers (8 providers)
        ↓                                       ↓                              ↓
  iOS Components                         Unified Model Interface          Model Adapters
  Zustand State                          Evaluation Engine                Provider-specific APIs
  Playwright Tests                       Real-time WebSockets             Intelligent Scoring
        ↓                                       ↓                              ↓
  Cloud Storage (Static)  ←→  Cloud Run (Backend API)  ←→  Secret Manager (API Keys)
                                        ↓
                              Cloud SQL (PostgreSQL)
```

### Tech Stack

**Frontend (wenxin-moyun/)**
- **Framework**: React 19 + TypeScript 5.8 + Vite 7.1
- **Styling**: Tailwind CSS 4.1 with pure iOS design tokens
- **State**: Zustand 4.4 + custom hooks
- **Animation**: Framer Motion 12.23 (iOS spring physics)
- **Charts**: Recharts 3.1 with D3 integration
- **Testing**: Playwright E2E (64 test cases across 9 spec files)

**Backend (wenxin-backend/)**
- **Framework**: FastAPI + SQLAlchemy (async)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **AI Integration**: Unified Model Interface with 8 provider adapters
- **Real-time**: WebSocket for battle updates
- **Deployment**: Docker + Google Cloud Run

## 🔒 Security Configuration & Credentials

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

### Required GCP IAM Roles

The GitHub Actions service account requires these roles:

1. **Artifact Registry Administrator** - Create/manage Docker repositories
2. **Cloud Run Admin** - Deploy services to Cloud Run  
3. **Cloud SQL Admin** - Manage database connections and migrations
4. **Secret Manager Secret Accessor** - Access API keys and secrets
5. **Storage Admin** - Deploy frontend to Cloud Storage

### GitHub Secrets Configuration

**Required Secrets in GitHub Repository Settings:**

| Secret | Description | Source |
|--------|-------------|---------|
| `GCP_SA_KEY` | Service account JSON | Google Cloud Console |
| `OPENAI_API_KEY` | OpenAI API access | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic API access | https://console.anthropic.com/ |
| `GEMINI_API_KEY` | Google Gemini API | Google AI Studio (optional) |

### Google Cloud Secret Manager

**Secrets stored in GCP Secret Manager:**

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `db-password` | Database password for PostgreSQL | `randomSecurePassword123` |
| `secret-key` | Application secret key for JWT tokens | `longRandomSecretKey456` |
| `openai-api-key` | OpenAI API key for AI model access | `sk-...` |
| `anthropic-api-key` | Anthropic API key for Claude models | `sk-ant-...` |
| `gemini-api-key` | Google Gemini API key | `AIza...` |

### Test Accounts

**Development Environment:**
- **Demo Account**: Username `demo` / Password `demo123`
- **Admin Account**: Username `admin` / Password `admin123`

### Database Configuration

**Development (SQLite):**
```env
DATABASE_URL=sqlite+aiosqlite:///./wenxin.db
```

**Production (PostgreSQL on Cloud SQL):**
```env
DATABASE_URL=postgresql+asyncpg://wenxin:[PASSWORD]@/wenxin_db?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres
```

**Database Instance Details:**
- **Instance Name**: `wenxin-postgres`
- **Database Name**: `wenxin_db`  
- **Username**: `wenxin`
- **Connection**: Cloud SQL Proxy via Unix socket

## 🛠️ First-time Setup Instructions

### 1. Google Cloud Platform Setup

**Enable Required APIs:**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

**Create Service Account:**
```bash
gcloud iam service-accounts create github-actions \
    --description="GitHub Actions CI/CD" \
    --display-name="GitHub Actions"
```

**Grant Required Roles:**
```bash
# Artifact Registry Administrator
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

# Cloud Run Admin
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/run.admin"

# Cloud SQL Admin
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/cloudsql.admin"

# Secret Manager Secret Accessor
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Storage Admin
gcloud projects add-iam-policy-binding wenxin-moyun-prod-new \
    --member="serviceAccount:github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

**Create Service Account Key:**
```bash
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@wenxin-moyun-prod-new.iam.gserviceaccount.com
```

### 2. Create Secrets in Secret Manager

```bash
# Database password
echo -n "your-secure-db-password" | gcloud secrets create db-password --data-file=-

# Application secret key
echo -n "your-long-random-secret-key" | gcloud secrets create secret-key --data-file=-

# AI API keys
echo -n "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-anthropic-api-key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
```

### 3. GitHub Repository Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions:

1. **GCP_SA_KEY**: Copy contents of `github-actions-key.json`
2. **OPENAI_API_KEY**: Your OpenAI API key
3. **ANTHROPIC_API_KEY**: Your Anthropic API key
4. **GEMINI_API_KEY**: Your Google Gemini API key (optional)

## 🧪 Testing

### E2E Testing (Playwright)

**Run Tests:**
```bash
cd wenxin-moyun

# Headless mode (CI)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed browser
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

**Test Coverage (64 tests across 9 spec files):**
- `homepage.spec.ts` - Homepage functionality and navigation
- `ai-models.spec.ts` - Leaderboard, NULL score handling, filtering  
- `ios-components.spec.ts` - iOS design system components
- `auth.spec.ts`, `battle.spec.ts`, `evaluation.spec.ts` - Core features
- `performance.spec.ts`, `visual.spec.ts` - Performance and visual regression

### Backend Testing

```bash
cd wenxin-backend

# Run all tests
pytest

# Run specific test with verbose output
pytest tests/test_auth.py -v

# Run tests with coverage
pytest --cov=app tests/
```

## 🚀 Deployment

### Automated Deployment (GitHub Actions)

**Trigger**: Push to `main` or `master` branch

**Pipeline Steps:**
1. **Test Phase**: Frontend build, backend tests, E2E tests
2. **Deploy Phase**: Docker build/push, database migrations, Cloud Run deployment
3. **Release Phase**: Automated release notes with service URLs

**Production URLs:**
- **Frontend**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/
- **Backend API**: Deployed to Cloud Run (URL in deployment logs)
- **API Docs**: `[BACKEND_URL]/docs`

### Manual Deployment

**Backend:**
```bash
docker build -f wenxin-backend/Dockerfile.cloud -t asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest wenxin-backend/
docker push asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest
gcloud run deploy wenxin-moyun-api --image=asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-backend:latest --region=asia-east1
```

**Frontend:**
```bash
cd wenxin-moyun
npm run build
gsutil -m rsync -r -d dist/ gs://wenxin-moyun-prod-new-static/
```

## 🎨 iOS Design System

The platform features a **complete iOS design system** with authentic Apple design language:

### Core Components

**IOSButton** - Native iOS button with glass morphism
```tsx
<IOSButton variant="primary" size="lg" glassMorphism emoji="like">
  Action
</IOSButton>
```

**IOSCard** - Container with structured content
```tsx
<IOSCard variant="elevated" interactive animate>
  <IOSCardHeader title="Title" emoji={<RankEmoji rank={1} />} />
  <IOSCardContent>Content</IOSCardContent>
  <IOSCardFooter>
    <IOSButton>Action</IOSButton>
  </IOSCardFooter>
</IOSCard>
```

**IOSToggle** - iOS-style switches
```tsx
<IOSToggle checked={value} onChange={setValue} color="green" />
```

### Emoji System

60+ Microsoft Fluent Emoji SVGs with semantic categorization:

```tsx
<StatusEmoji status="completed" animated />  // ✅
<RankEmoji rank={1} size="lg" />            // 🥇
<TypeEmoji type="painting" size="md" />     // 🎨
```

### Theme System

**iOS Colors:**
- Blue `#007AFF` (Primary)
- Green `#34C759` (Success)
- Orange `#FF9500` (Warning)  
- Red `#FF3B30` (Destructive)

**Glass Morphism Effects:**
- Native backdrop-blur and transparency
- iOS-style shadows and surfaces
- Subtle noise texture for authenticity

## 🛠️ Development Commands

### Frontend (wenxin-moyun/)

```bash
npm run dev                   # Start dev server (port 5173+)
npm run build                 # TypeScript check + production build
npm run lint                  # ESLint validation
npm run preview               # Preview production build

# E2E Testing (Playwright - 64 test cases)
npm run test:e2e              # Run tests headless across all browsers
npm run test:e2e:ui           # Interactive UI mode for debugging
npm run test:e2e:debug        # Step-by-step debugging mode
npm run test:e2e:headed       # Run tests in visible browser
npm run test:e2e:report       # Show HTML test report
npm run test:e2e -- --grep="auth"  # Run specific test pattern

# Environment validation
npm run validate-env          # Verify Node.js/Python versions match CI
```

### Backend (wenxin-backend/)

```bash
pip install -r requirements.txt                        # Install dependencies
python -m uvicorn app.main:app --reload --port 8001   # Start API server
python init_db.py                                     # Reset database with sample data

# Testing
pytest                        # Run all tests
pytest tests/test_auth.py -v  # Run specific test verbose
pytest -k "test_login" -v     # Run tests matching pattern
pytest --cov=app tests/       # Test coverage

# AI Model Testing
python test_unified_interface.py  # Verify models use correct APIs
python openai_benchmark.py        # Run real AI benchmarks
```

## 🐛 Common Issues & Solutions

### Secret Manager Access Issues

**Problem**: `NOT_FOUND: Secret [projects/8164039155/secrets/db-password] not found`

**Solution**: Ensure project ID (not numeric ID) is used:
```bash
# ❌ Wrong (uses numeric ID)
gcloud secrets versions access latest --secret="db-password"

# ✅ Correct (specifies project ID)
gcloud secrets versions access latest --secret="db-password" --project=wenxin-moyun-prod-new
```

### Artifact Registry Permission Denied

**Problem**: `Permission denied` when pushing Docker images

**Solutions**:
1. Verify service account has `artifactregistry.admin` role
2. Ensure repository exists:
   ```bash
   gcloud artifacts repositories create wenxin-images \
     --repository-format=docker \
     --location=asia-east1
   ```

### Playwright Test Issues

**Strict Mode Violations**:
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

### Environment Issues

**Node.js Version**: Must use 20.19.4 for CI compatibility
```bash
# Check version
node --version

# Install correct version (using nvm)
nvm install 20.19.4
nvm use 20.19.4
```

**Port Conflicts**: Frontend auto-increments from 5173 if port is taken

**Windows Compatibility**: Use `del` instead of `rm`, check Windows Defender

## 📊 Monitoring & Health Checks

### Health Endpoints

**Backend Health Check:**
```bash
curl -f "[BACKEND_URL]/health"
```

**Frontend Health Check:**
```bash
curl -f "https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html"
```

### Database Operations

**Check Model Rankings:**
```bash
cd wenxin-backend
python -c "
import sqlite3
conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()
cursor.execute('SELECT name, model_type, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST')
print([f'{row[0]}: {row[2] if row[2] is not None else \"N/A\"}' for row in cursor.fetchall()[:10]])
conn.close()
"
```

**Reset Development Database:**
```bash
# Windows
del wenxin.db

# Linux/macOS  
rm wenxin.db

# Recreate with sample data
python init_db.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/myhr-dev/website/issues)
- Email: support@wenxin-moyun.com
- Documentation: See `CLAUDE.md` for detailed technical documentation

---

**Built with ❤️ using React 19, FastAPI, and Google Cloud Platform**