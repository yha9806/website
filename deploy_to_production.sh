#!/bin/bash
# Deploy comprehensive benchmark data to production
# This script handles both backend and frontend deployment

set -e  # Exit on error

echo "========================================"
echo "PRODUCTION DEPLOYMENT SCRIPT"
echo "Date: $(date)"
echo "========================================"

# Configuration
PROJECT_ID="wenxin-moyun-prod-new"
REGION="asia-east1"
SERVICE_NAME="wenxin-moyun-api"
BUCKET_NAME="wenxin-moyun-prod-new-static"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Phase 1: Backend Data Migration
echo ""
echo "Phase 1: Backend Data Migration"
echo "----------------------------------------"

print_status "Setting up Cloud SQL proxy connection..."
# Note: Cloud SQL proxy should be running
# cloud_sql_proxy -instances=${PROJECT_ID}:${REGION}:wenxin-postgres=tcp:5432 &

print_warning "Make sure Cloud SQL proxy is running on port 5432"
read -p "Press Enter to continue..."

# Set production environment variables
export ENVIRONMENT="production"
export DATABASE_URL="postgresql+asyncpg://wenxin:${DB_PASSWORD}@localhost:5432/wenxin_db"

# Run database cleanup
print_status "Cleaning production database..."
cd wenxin-backend
python clean_production_db.py

# Import comprehensive data
print_status "Importing comprehensive benchmark data..."
python import_comprehensive_data.py

print_status "Backend data migration completed!"

# Phase 2: Backend API Deployment
echo ""
echo "Phase 2: Backend API Deployment"
echo "----------------------------------------"

print_status "Building Docker image..."
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/wenxin-images/wenxin-backend:latest .

print_status "Pushing Docker image to Artifact Registry..."
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/wenxin-images/wenxin-backend:latest

print_status "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/wenxin-images/wenxin-backend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=production" \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:wenxin-postgres \
  --project ${PROJECT_ID}

print_status "Backend API deployed successfully!"

# Phase 3: Frontend Deployment
echo ""
echo "Phase 3: Frontend Deployment"
echo "----------------------------------------"

cd ../wenxin-moyun

print_status "Installing frontend dependencies..."
npm install --legacy-peer-deps

print_status "Building frontend for production..."
npm run build

print_status "Uploading to Cloud Storage..."
gsutil -m rsync -r -d dist/ gs://${BUCKET_NAME}/

print_status "Setting cache control for static assets..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://${BUCKET_NAME}/**/*.js"
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://${BUCKET_NAME}/**/*.css"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://${BUCKET_NAME}/**/*.png"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://${BUCKET_NAME}/**/*.jpg"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://${BUCKET_NAME}/**/*.svg"

print_status "Frontend deployed successfully!"

# Phase 4: Verification
echo ""
echo "Phase 4: Deployment Verification"
echo "----------------------------------------"

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)' --project ${PROJECT_ID})
FRONTEND_URL="https://storage.googleapis.com/${BUCKET_NAME}/index.html#/"

print_status "Backend API URL: ${SERVICE_URL}"
print_status "Frontend URL: ${FRONTEND_URL}"

# Test backend health
print_status "Testing backend health endpoint..."
curl -s "${SERVICE_URL}/health" | python -m json.tool

# Test models endpoint
print_status "Testing models endpoint..."
curl -s "${SERVICE_URL}/api/v1/models?limit=5" | python -m json.tool | head -20

echo ""
echo "========================================"
echo -e "${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "========================================"
echo ""
echo "Access your application at:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend API: ${SERVICE_URL}"
echo ""
echo "Next steps:"
echo "  1. Verify the application is working correctly"
echo "  2. Check that iOS liquid glass effects are displaying"
echo "  3. Confirm highlights and weaknesses are showing"
echo "  4. Monitor Cloud Run logs for any issues"
echo ""