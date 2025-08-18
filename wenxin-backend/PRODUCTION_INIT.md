# Production Data Initialization Guide

## Overview

This guide explains how to safely initialize or reset the production database with the complete set of 42 AI models including all classification fields (model_type, model_tier, llm_rank, image_rank).

## Problem Background

The production database migration issue occurred due to a misunderstanding of Alembic commands:
- **`alembic stamp head`**: Only updates the version table without executing SQL migrations
- **`alembic upgrade head`**: Actually executes the SQL migrations to modify schema

This led to production having incomplete schema (missing columns) despite showing successful migration status.

## Solution Architecture

### 1. Schema Migration (Already Completed)
- Fixed using `migrate.py` script that properly runs `alembic upgrade head`
- Adds required columns: model_type, model_tier, llm_rank, image_rank
- Schema is now correct in production

### 2. Data Initialization (This Guide)
- Uses `init_production_models.py` to populate 42 models with complete data
- All new fields properly populated
- Preserves existing user data (battles, artworks)

## Files Created

### 1. `init_production_models.py`
Complete script with:
- 42 AI models from 15 organizations
- All classification fields populated
- Transaction-safe operations
- Comprehensive error handling

### 2. `Dockerfile.init`
Specialized Docker image for initialization:
- Based on Python 3.13-slim
- Contains only necessary files
- Optimized for Cloud Run Jobs

### 3. `.github/workflows/init-production-data.yml`
GitHub Actions workflow for safe production initialization:
- Manual trigger with confirmation
- Cloud Run Job execution
- Automatic verification

## How to Initialize Production

### Option 1: Via GitHub Actions (Recommended)

1. Go to GitHub Actions tab in your repository
2. Select "Initialize Production Data" workflow
3. Click "Run workflow"
4. Type "yes" in the confirmation field
5. Click "Run workflow" button

The workflow will:
- Build and push initialization image
- Create Cloud Run Job
- Execute initialization
- Verify 42 models loaded
- Clean up resources

### Option 2: Manual Cloud Run Job

```bash
# Build and push image
docker build -f wenxin-backend/Dockerfile.init \
  -t asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-init:latest \
  wenxin-backend/

docker push asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-init:latest

# Create and run job
gcloud run jobs create wenxin-init-data \
  --image=asia-east1-docker.pkg.dev/wenxin-moyun-prod-new/wenxin-images/wenxin-init:latest \
  --region=asia-east1 \
  --task-timeout=900 \
  --memory=2Gi \
  --set-cloudsql-instances=wenxin-moyun-prod-new:asia-east1:wenxin-postgres \
  --set-env-vars="DATABASE_URL=postgresql+asyncpg://wenxin:YOUR_PASSWORD@/wenxin_db?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres"

gcloud run jobs execute wenxin-init-data --region=asia-east1 --wait
```

### Option 3: Direct Script Execution (Emergency Only)

```bash
# Set environment variable
export DATABASE_URL="postgresql+asyncpg://wenxin:PASSWORD@/wenxin_db?host=/cloudsql/..."

# Run script
python init_production_models.py
```

## Verification

After initialization, verify the data:

### Via API
```bash
# Check model count (should be 42)
curl https://wenxin-moyun-api-229980166599.asia-east1.run.app/api/v1/models/ | jq '. | length'

# Check top models with new fields
curl https://wenxin-moyun-api-229980166599.asia-east1.run.app/api/v1/models/ | \
  jq '.[:5] | .[] | {name, organization, overall_score, model_type, model_tier, llm_rank}'
```

### Expected Results
- Total models: 42
- Models with model_type: 42
- Models with scores: 35 (7 image models have NULL scores intentionally)
- Top model: GPT-4o (score: 95.0, type: multimodal, tier: flagship)

## Safety Features

1. **Transaction Safety**: All operations in single transaction - rollback on any error
2. **User Data Preservation**: Only touches ai_models table
3. **Validation**: Verifies data integrity before committing
4. **Idempotent**: Safe to run multiple times (clears then inserts)
5. **Comprehensive Logging**: Detailed progress and error reporting

## Model Classification System

### Model Types
- **llm**: Language models (GPT-4, Claude, Llama, etc.)
- **image**: Image generation models (DALL-E, Midjourney, Stable Diffusion)
- **multimodal**: Models handling both text and images (GPT-4o, Gemini 1.5 Pro)
- **audio**: Speech/audio models (Whisper)

### Model Tiers
- **flagship**: Top-tier, most capable models
- **professional**: Production-ready, balanced performance
- **efficient**: Fast, cost-effective models
- **lightweight**: Small models for edge deployment

### Rankings
- **llm_rank**: 1-20 for language models (1 = best)
- **image_rank**: 1-4 for image models (1 = best)
- Models have NULL rank for categories they don't belong to

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Ensure DATABASE_URL is set correctly
   - Check Cloud SQL proxy connection

2. **Migration Not Applied**
   - Run `migrate.py` first to ensure schema is correct
   - Check alembic_version table shows latest revision

3. **Data Count Mismatch**
   - Check transaction completed successfully
   - Verify no concurrent modifications

4. **Cloud Run Job Fails**
   - Check logs: `gcloud run jobs logs read wenxin-init-data --region=asia-east1`
   - Ensure Cloud SQL instance is accessible
   - Verify database password in Secret Manager

## Rollback Procedure

If initialization causes issues:

1. Data is transaction-safe - failed attempts auto-rollback
2. To restore previous data, maintain backup before initialization
3. User data (battles, artworks) is never touched

## Production URLs

- **Frontend**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html
- **API**: https://wenxin-moyun-api-229980166599.asia-east1.run.app
- **API Docs**: https://wenxin-moyun-api-229980166599.asia-east1.run.app/docs

## Next Steps

After successful initialization:
1. Verify frontend displays all 42 models correctly
2. Check leaderboard shows proper rankings
3. Test model filtering by type/tier
4. Confirm battle mode works with new classifications
5. Monitor for any performance impacts