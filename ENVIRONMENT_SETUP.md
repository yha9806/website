# Environment Setup Guide

## 🎯 Environment Standardization (2025-08-15)

This project ensures **100% consistency** between local development and GitHub Actions CI environment to eliminate "works locally but fails in CI" issues.

## Required Versions

### Core Requirements (GitHub Actions Standard)
- **Node.js**: `20.19.4` (locked via `.nvmrc`)
- **npm**: `≥10.0.0` (enforced via `package.json` engines)
- **Python**: `3.10` (locked via `.python-version`)

### Quick Setup

```bash
# 1. Install Node.js via nvm (recommended)
nvm install 20.19.4
nvm use 20.19.4

# 2. Verify environment consistency
cd wenxin-moyun
npm run validate-env

# 3. Install dependencies (uses .npmrc configuration)
npm install

# 4. Install Playwright browsers
npx playwright install

# 5. Verify Playwright E2E tests work locally
npm run test:e2e
```

## Version Lock Files

The project includes comprehensive version management:

| File | Purpose | Content |
|------|---------|---------|
| `.nvmrc` | Node.js version lock | `20.19.4` |
| `.python-version` | Python version lock | `3.10` |
| `.npmrc` | npm configuration | `legacy-peer-deps=true` |
| `package.json` | engines field | Node.js ≥20.19.4, npm ≥10.0.0 |

## Environment Validation

### Automated Validation Script

Run `npm run validate-env` to check:
- ✅ Node.js version matches CI (20.19.4)
- ✅ npm version is compatible (≥10.0.0)
- ✅ Python version matches CI (3.10)
- ✅ All configuration files exist
- ✅ npm configuration is correct
- ✅ Playwright is properly installed

### Manual Verification

```bash
# Check versions
node --version    # Should show v20.19.4
npm --version     # Should show ≥10.0.0
python --version  # Should show Python 3.10.x

# Check npm configuration
npm config list | grep legacy-peer-deps  # Should show "true"

# Check file existence
ls .nvmrc .python-version .npmrc  # All should exist
```

## Playwright E2E Testing

### Environment Parity

Local development now uses **identical configuration** to GitHub Actions CI:

| Aspect | Local | GitHub Actions | Status |
|--------|-------|----------------|--------|
| Node.js | 20.19.4 | 20.19.4 | ✅ Identical |
| Browsers | Chromium only | Chromium only | ✅ Identical |
| Timeouts | 45s | 45s | ✅ Identical |
| Workers | 1 | 1 | ✅ Identical |
| Storage | Enhanced mock | Enhanced mock | ✅ Identical |

### Enhanced Storage System

**Problem Solved**: CI environments often block localStorage/sessionStorage access, causing tests to fail.

**Solution**: Enhanced storage compatibility system:

```typescript
// Automatic storage detection and fallback
import { safeStorage } from './tests/e2e/utils/storage-mock';

// This works in both local and CI environments
safeStorage.setLocalItem('access_token', token);
const token = safeStorage.getLocalItem('access_token');
```

**Features:**
- 🔄 Automatic fallback to memory storage when real storage blocked
- 🎯 Consistent API across all environments
- 🧪 Complete Storage interface implementation
- 📊 Transparent error handling and logging

## Troubleshooting

### Version Mismatch Issues

```bash
# If Node.js version is wrong
nvm install 20.19.4
nvm use 20.19.4
nvm alias default 20.19.4

# If npm version is old
npm install -g npm@latest

# If Python version is wrong (Windows)
# Download Python 3.10.x from python.org

# If dependencies fail to install
rm -rf node_modules package-lock.json
npm install
```

### E2E Test Issues

```bash
# Storage access errors
npm run test:e2e -- --grep="auth"  # Test authentication specifically

# Playwright browser issues
npx playwright install --force

# Configuration validation
npm run validate-env
```

### GitHub Actions Sync Issues

If tests pass locally but fail in CI:
1. Run `npm run validate-env` - ensure versions match
2. Check `.nvmrc` content matches CI workflow
3. Verify `.npmrc` settings are correct
4. Test with identical browser configuration (`Chromium only`)

## Development Workflow

### Before Making Changes

```bash
# 1. Verify environment
npm run validate-env

# 2. Run tests locally (using CI configuration)
npm run test:e2e

# 3. Make changes...

# 4. Test again before pushing
npm run test:e2e
```

### Before Pushing to GitHub

- ✅ Environment validation passes
- ✅ E2E tests pass locally with CI configuration
- ✅ No version mismatches detected
- ✅ Storage compatibility verified

## Benefits

✅ **Eliminated "Works locally but fails in CI"**  
✅ **Predictable test behavior across environments**  
✅ **Faster debugging with identical configurations**  
✅ **Reduced CI failures due to environment differences**  
✅ **Consistent developer experience across team**

## Questions?

Run `npm run validate-env` first. If issues persist, check:
1. Node.js version: `node --version`
2. npm configuration: `npm config list`
3. Playwright installation: `npx playwright --version`
4. Storage compatibility: Run authentication tests