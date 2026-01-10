@echo off
REM Deploy comprehensive benchmark data to production
REM This script handles both backend and frontend deployment

echo ========================================
echo PRODUCTION DEPLOYMENT SCRIPT
echo Date: %date% %time%
echo ========================================

REM Configuration
set PROJECT_ID=wenxin-moyun-prod-new
set REGION=asia-east1
set SERVICE_NAME=wenxin-moyun-api
set BUCKET_NAME=wenxin-moyun-prod-new-static

REM Phase 1: Backend Data Migration
echo.
echo Phase 1: Backend Data Migration
echo ----------------------------------------

echo [!] Setting up Cloud SQL proxy connection...
echo [!] Make sure Cloud SQL proxy is running on port 5432
echo [!] Run: cloud_sql_proxy -instances=%PROJECT_ID%:%REGION%:wenxin-postgres=tcp:5432
pause

REM Set production environment variables
set ENVIRONMENT=production
set DATABASE_URL=postgresql+asyncpg://wenxin:%DB_PASSWORD%@localhost:5432/wenxin_db

REM Run database cleanup
echo [+] Cleaning production database...
cd wenxin-backend
python clean_production_db.py
if %errorlevel% neq 0 (
    echo [X] Database cleanup failed!
    pause
    exit /b 1
)

REM Import comprehensive data
echo [+] Importing comprehensive benchmark data...
python import_comprehensive_data.py
if %errorlevel% neq 0 (
    echo [X] Data import failed!
    pause
    exit /b 1
)

echo [+] Backend data migration completed!

REM Phase 2: Backend API Deployment
echo.
echo Phase 2: Backend API Deployment
echo ----------------------------------------

echo [+] Building Docker image...
docker build -t %REGION%-docker.pkg.dev/%PROJECT_ID%/wenxin-images/wenxin-backend:latest .
if %errorlevel% neq 0 (
    echo [X] Docker build failed!
    pause
    exit /b 1
)

echo [+] Pushing Docker image to Artifact Registry...
docker push %REGION%-docker.pkg.dev/%PROJECT_ID%/wenxin-images/wenxin-backend:latest
if %errorlevel% neq 0 (
    echo [X] Docker push failed!
    pause
    exit /b 1
)

echo [+] Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %REGION%-docker.pkg.dev/%PROJECT_ID%/wenxin-images/wenxin-backend:latest ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars "ENVIRONMENT=production" ^
  --add-cloudsql-instances %PROJECT_ID%:%REGION%:wenxin-postgres ^
  --project %PROJECT_ID%

if %errorlevel% neq 0 (
    echo [X] Cloud Run deployment failed!
    pause
    exit /b 1
)

echo [+] Backend API deployed successfully!

REM Phase 3: Frontend Deployment
echo.
echo Phase 3: Frontend Deployment
echo ----------------------------------------

cd ..\wenxin-moyun

echo [+] Installing frontend dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [X] npm install failed!
    pause
    exit /b 1
)

echo [+] Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo [X] Frontend build failed!
    pause
    exit /b 1
)

echo [+] Uploading to Cloud Storage...
gsutil -m rsync -r -d dist/ gs://%BUCKET_NAME%/
if %errorlevel% neq 0 (
    echo [X] Cloud Storage upload failed!
    pause
    exit /b 1
)

echo [+] Setting cache control for static assets...
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://%BUCKET_NAME%/**/*.js"
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://%BUCKET_NAME%/**/*.css"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://%BUCKET_NAME%/**/*.png"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://%BUCKET_NAME%/**/*.jpg"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://%BUCKET_NAME%/**/*.svg"

echo [+] Frontend deployed successfully!

REM Phase 4: Verification
echo.
echo Phase 4: Deployment Verification
echo ----------------------------------------

REM Get service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)" --project %PROJECT_ID%') do set SERVICE_URL=%%i

set FRONTEND_URL=https://storage.googleapis.com/%BUCKET_NAME%/index.html#/

echo [+] Backend API URL: %SERVICE_URL%
echo [+] Frontend URL: %FRONTEND_URL%

REM Test backend health
echo [+] Testing backend health endpoint...
curl -s "%SERVICE_URL%/health"

echo.
echo ========================================
echo DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Access your application at:
echo   Frontend: %FRONTEND_URL%
echo   Backend API: %SERVICE_URL%
echo.
echo Next steps:
echo   1. Verify the application is working correctly
echo   2. Check that iOS liquid glass effects are displaying
echo   3. Confirm highlights and weaknesses are showing
echo   4. Monitor Cloud Run logs for any issues
echo.

cd ..
pause