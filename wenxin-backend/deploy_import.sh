#!/bin/bash
# Deploy production_import.py to Cloud Run and execute

echo "============================================"
echo "Deploying Data Import to Cloud Run"
echo "============================================"

# Deploy to Cloud Run with environment variables
gcloud run deploy wenxin-import-job \
  --source . \
  --platform managed \
  --region asia-east1 \
  --project wenxin-moyun-prod-new \
  --no-allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=production" \
  --set-env-vars="DATABASE_URL=postgresql+asyncpg://postgres:Qnqwdn7800@/wenxin?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres" \
  --add-cloudsql-instances=wenxin-moyun-prod-new:asia-east1:wenxin-postgres \
  --service-account=wenxin-sa@wenxin-moyun-prod-new.iam.gserviceaccount.com \
  --memory=1Gi \
  --cpu=1 \
  --timeout=600 \
  --command="python,production_import.py"

echo "Import job deployed to Cloud Run"
echo "Run the job by visiting the Cloud Run service URL"