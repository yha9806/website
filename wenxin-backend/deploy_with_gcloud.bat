@echo off
echo Deploying import job to Cloud Run...

REM Build and push container
gcloud builds submit --tag gcr.io/wenxin-moyun-prod-new/import-job .

REM Deploy as Cloud Run Job
gcloud run jobs create import-comprehensive-data ^
  --image gcr.io/wenxin-moyun-prod-new/import-job ^
  --region asia-east1 ^
  --set-env-vars="ENVIRONMENT=production" ^
  --set-env-vars="DATABASE_URL=postgresql+asyncpg://postgres:Qnqwdn7800@/wenxin?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres" ^
  --set-cloudsql-instances=wenxin-moyun-prod-new:asia-east1:wenxin-postgres ^
  --service-account=wenxin-sa@wenxin-moyun-prod-new.iam.gserviceaccount.com ^
  --memory=1Gi ^
  --task-timeout=600 ^
  --parallelism=1 ^
  --max-retries=0

REM Execute the job
gcloud run jobs execute import-comprehensive-data --region asia-east1

echo Import job deployed and executed!