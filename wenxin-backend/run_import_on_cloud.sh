#!/bin/bash
# Run benchmark import directly on Cloud Run

echo "Executing benchmark import on Cloud Run..."

gcloud run jobs create benchmark-import \
  --image gcr.io/wenxin-moyun-prod-new/wenxin-backend:latest \
  --region asia-east1 \
  --command python \
  --args import_benchmark_data.py \
  --set-env-vars ENVIRONMENT=production,USE_CLOUD_SQL=True \
  --set-cloudsql-instances wenxin-moyun-prod-new:asia-east1:wenxin-postgres \
  --service-account wenxin-moyun@wenxin-moyun-prod-new.iam.gserviceaccount.com \
  --max-retries 1 \
  --parallelism 1 \
  --task-timeout 3600 \
  --memory 2Gi

echo "Job created. Executing..."

gcloud run jobs execute benchmark-import \
  --region asia-east1 \
  --wait

echo "Import completed!"
