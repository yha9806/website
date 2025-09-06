# WenXin MoYun - Google Cloud Platform Deployment Guide

🚀 **Production deployment guide for WenXin MoYun AI art evaluation platform using Google Cloud Platform**

## Overview

This guide covers the complete deployment of WenXin MoYun to Google Cloud Platform, including:
- **Frontend**: React 19 app deployed to Cloud Storage with CDN
- **Backend**: FastAPI deployed to Cloud Run with auto-scaling
- **Database**: Cloud SQL PostgreSQL with automated backups
- **Monitoring**: Complete observability with Cloud Monitoring and Logging
- **CI/CD**: Automated deployments with GitHub Actions
- **NEW: VULCA Integration**: 47-dimensional evaluation system integrated with Rankings

## Architecture

```
Internet → Cloud CDN → Cloud Storage (Frontend)
                    ↘
                     Cloud Run (Backend API)
                             ↓
                     Cloud SQL (PostgreSQL)
                             ↓
                     Secret Manager (API Keys)
```

## Prerequisites

### 1. Google Cloud Setup
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Project with sufficient permissions

### 2. Repository Setup
- GitHub repository with the WenXin MoYun code
- Repository secrets configured for GCP deployment

### 3. Required API Keys
- OpenAI API key (for AI model evaluations)
- Anthropic API key (optional, for Claude models)
- Google Gemini API key (optional, for Gemini models)
- Additional AI provider keys as needed

## Quick Deployment

### Option 1: Automated Setup (Recommended)

1. **Clone and prepare the repository:**
```bash
git clone <your-repo-url>
cd website
```

2. **Run the complete setup script:**
```bash
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

3. **Configure GitHub Actions secrets** (see [GitHub Secrets Configuration](#github-secrets-configuration))

4. **Push to main branch to trigger deployment:**
```bash
git add .
git commit -m "Initial GCP deployment setup"
git push origin main
```

### Option 2: Manual Step-by-Step

#### Step 1: GCP Project Setup

```bash
# Set project variables
export PROJECT_ID="wenxin-moyun-prod"
export REGION="asia-east1"

# Create and configure project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud auth login
```

#### Step 2: Enable APIs

```bash
# Enable required GCP services
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

#### Step 3: Create Infrastructure

```bash
# Create Artifact Registry
gcloud artifacts repositories create wenxin-images \
  --repository-format=docker \
  --location=$REGION

# Create Cloud SQL instance
gcloud sql instances create wenxin-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=20GB \
  --backup-start-time=02:00

# Create database
gcloud sql databases create wenxin_db --instance=wenxin-postgres

# Create database user
gcloud sql users create wenxin \
  --instance=wenxin-postgres \
  --password=$(openssl rand -base64 32)

# Create Cloud Storage buckets
gsutil mb -l $REGION gs://$PROJECT_ID-static
gsutil mb -l $REGION gs://$PROJECT_ID-backups
```

#### Step 4: Setup Secrets

```bash
# Create secrets for API keys and database password
gcloud secrets create db-password --data-file=<(echo "your-secure-db-password")
gcloud secrets create secret-key --data-file=<(echo "your-secret-key-here")
gcloud secrets create openai-api-key --data-file=<(echo "your-openai-api-key")
gcloud secrets create anthropic-api-key --data-file=<(echo "your-anthropic-api-key")
gcloud secrets create gemini-api-key --data-file=<(echo "your-gemini-api-key")
```

#### Step 5: Setup Monitoring

```bash
# Run monitoring setup script
chmod +x scripts/setup-monitoring.sh
./scripts/setup-monitoring.sh
```

#### Step 6: Configure GitHub Actions

Add the following secrets to your GitHub repository:

## GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions, then add:

### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `GCP_SA_KEY` | Service account JSON key | Run: `gcloud iam service-accounts keys create key.json --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com` |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | https://console.anthropic.com/ |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | https://ai.google.dev/ |

### GitHub Actions Workflow

The deployment is automated through GitHub Actions. On every push to `main`:

1. **Test Phase**: Runs linting, building, and E2E tests
2. **Deploy Phase**: 
   - Builds and pushes Docker images
   - Runs database migrations
   - Deploys backend to Cloud Run
   - Deploys frontend to Cloud Storage
   - Runs health checks

## Manual Deployment Commands

### Backend Deployment

```bash
# Build and push backend image
docker build -f wenxin-backend/Dockerfile.cloud \
  -t asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest \
  wenxin-backend/

docker push asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest

# Deploy to Cloud Run
gcloud run deploy wenxin-moyun-api \
  --image=asia-east1-docker.pkg.dev/$PROJECT_ID/wenxin-images/wenxin-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-cloudsql-instances=$PROJECT_ID:$REGION:wenxin-postgres \
  --update-env-vars="DATABASE_URL=postgresql+asyncpg://wenxin:PASSWORD@/wenxin_db?host=/cloudsql/$PROJECT_ID:$REGION:wenxin-postgres" \
  --update-secrets="OPENAI_API_KEY=openai-api-key:latest"
```

### Frontend Deployment

```bash
cd wenxin-moyun

# Set backend URL
export VITE_API_BASE_URL=$(gcloud run services describe wenxin-moyun-api --region=$REGION --format="value(status.url)")

# Build frontend
npm run build

# Deploy to Cloud Storage
gsutil -m rsync -r -d dist/ gs://$PROJECT_ID-static/

# Set public permissions
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-static
```

### Database Migration

```bash
# Run migration script
cd wenxin-backend
python scripts/migrate-to-cloud-sql.py

# VULCA Integration: Run additional migrations
alembic upgrade head

# Generate initial VULCA test data (optional)
python generate_vulca_test_data.py
```

## Environment Configuration

### Frontend Environment Variables

These are set during the build process:

```bash
# Production environment variables
VITE_API_BASE_URL=https://wenxin-moyun-api-asia-east1.run.app
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

### Backend Environment Variables

Set through Cloud Run configuration:

```bash
DATABASE_URL=postgresql+asyncpg://wenxin:PASSWORD@/wenxin_db?host=/cloudsql/PROJECT:REGION:wenxin-postgres
SECRET_KEY=your-secret-key
DEBUG=false
ENVIRONMENT=production
```

## Monitoring and Observability

### Access Monitoring Dashboard

- **Cloud Monitoring**: https://console.cloud.google.com/monitoring/dashboards
- **Logs**: https://console.cloud.google.com/logs
- **Error Reporting**: https://console.cloud.google.com/errors
- **Trace**: https://console.cloud.google.com/traces

### Key Metrics Being Monitored

1. **API Health**: Response time, error rate, availability
2. **Resource Usage**: CPU, memory, database connections
3. **Business Metrics**: Evaluations processed, user activity
4. **Security**: Authentication failures, suspicious activity

### Alerts Configuration

Alerts are automatically configured for:
- API downtime (>5 minutes)
- High error rate (>5%)
- High response time (>2 seconds)
- Resource exhaustion (CPU >80%, Memory >85%)
- Database issues

## Scaling and Performance

### Auto-scaling Configuration

**Cloud Run** (Backend):
- Min instances: 0 (cost-effective)
- Max instances: 10 (prevents runaway costs)
- Concurrency: 100 requests per instance
- CPU allocation: 1 vCPU
- Memory allocation: 2 GB

**Cloud SQL** (Database):
- Machine type: db-f1-micro (upgradeable)
- Storage: 20GB SSD (auto-expanding)
- Connections: up to 25 concurrent

### Performance Optimizations

1. **Frontend**:
   - Static hosting on Cloud Storage with CDN
   - Gzip compression enabled
   - Asset caching with long expiry
   - Code splitting for optimal bundle size

2. **Backend**:
   - Connection pooling with SQLAlchemy
   - Async request handling with FastAPI
   - Cloud SQL Proxy for secure connections
   - Request caching for frequently accessed data

3. **Database**:
   - Proper indexing on frequently queried columns
   - Connection pooling to prevent connection exhaustion
   - Automated backups and point-in-time recovery

## Security

### Security Measures Implemented

1. **Network Security**:
   - HTTPS-only (TLS 1.2+)
   - CORS properly configured
   - Cloud IAM for access control

2. **Data Security**:
   - Secrets stored in Secret Manager
   - Database encryption at rest and in transit
   - No hardcoded credentials

3. **Application Security**:
   - Input validation and sanitization
   - SQL injection prevention with ORM
   - Security headers configured

4. **Access Security**:
   - Service accounts with minimal permissions
   - Regular credential rotation
   - Audit logging enabled

### Security Headers

The following security headers are configured:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

## Backup and Disaster Recovery

### Automated Backups

1. **Database Backups**:
   - Daily automated backups at 02:00 UTC
   - 7-day retention for point-in-time recovery
   - Cross-region backup replication (optional)

2. **Application Backups**:
   - Code stored in GitHub (version control)
   - Docker images stored in Artifact Registry
   - Configuration stored in repository

### Disaster Recovery Plan

1. **Database Recovery**:
   ```bash
   # Restore from backup
   gcloud sql backups restore BACKUP_ID --restore-instance=wenxin-postgres-restore
   ```

2. **Application Recovery**:
   ```bash
   # Redeploy from last known good version
   gcloud run deploy wenxin-moyun-api --image=LAST_KNOWN_GOOD_IMAGE
   ```

3. **DNS Recovery**:
   - Update DNS records to point to backup instance
   - Implement health checks for automatic failover

## Cost Optimization

### Estimated Monthly Costs

**Small-Medium Load** (< 10k requests/day):
- Cloud Run: $5-15/month
- Cloud SQL: $25-50/month
- Cloud Storage: $1-5/month
- **Total: ~$30-70/month**

**High Load** (> 100k requests/day):
- Cloud Run: $50-200/month
- Cloud SQL: $100-300/month
- Cloud Storage: $5-20/month
- **Total: ~$155-520/month**

### Cost Optimization Tips

1. **Use Cloud Run's scale-to-zero** to minimize costs during low traffic
2. **Right-size Cloud SQL instances** based on actual usage
3. **Enable Cloud Storage lifecycle policies** to archive old data
4. **Monitor usage with billing alerts** to prevent unexpected charges
5. **Use committed use discounts** for predictable workloads

## Troubleshooting

### Common Issues and Solutions

#### 1. Deployment Failures

**Issue**: GitHub Actions deployment fails
```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

**Issue**: Cloud Run service not starting
```bash
# Check service logs
gcloud run services logs wenxin-moyun-api --region=asia-east1
```

#### 2. Database Connection Issues

**Issue**: Cannot connect to Cloud SQL
```bash
# Test Cloud SQL connection
gcloud sql connect wenxin-postgres --user=wenxin
```

**Issue**: Database migration fails
```bash
# Check database status
gcloud sql operations list --instance=wenxin-postgres
```

#### 3. Frontend Issues

**Issue**: Static assets not loading
```bash
# Check bucket permissions
gsutil iam get gs://PROJECT_ID-static
```

**Issue**: API calls failing from frontend
```bash
# Check CORS configuration in backend
# Verify VITE_API_BASE_URL is correct
```

### Health Checks

#### Backend Health Check
```bash
curl https://wenxin-moyun-api-asia-east1.run.app/health
```
Expected response: `{"status": "healthy", "version": "1.0.0"}`

#### Frontend Health Check
```bash
curl https://storage.googleapis.com/PROJECT_ID-static/index.html
```
Expected: HTML content of the React app

#### Database Health Check
```bash
# From backend container
python -c "from app.database import engine; print('DB OK' if engine else 'DB Failed')"
```

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review monitoring alerts and metrics
- Check for security updates
- Verify backup integrity

#### Monthly
- Update dependencies (package.json, requirements.txt)
- Review and optimize costs
- Performance analysis and optimization

#### Quarterly
- Security audit and penetration testing
- Disaster recovery testing
- Capacity planning review

### Update Procedures

#### Backend Updates
1. Test changes locally
2. Run CI/CD pipeline
3. Monitor deployment health checks
4. Rollback if issues detected

#### Frontend Updates
1. Build and test locally
2. Deploy to staging (optional)
3. Deploy to production via CI/CD
4. Verify static assets are updated

## Support and Resources

### Documentation Links
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Cloud Monitoring](https://cloud.google.com/monitoring/docs)

### Getting Help
- **GCP Support**: Available through Google Cloud Console
- **Community**: Stack Overflow with `google-cloud-platform` tag
- **GitHub Issues**: Repository issues for application-specific problems

### Emergency Contacts
- Cloud incidents: Google Cloud Status Page
- Application issues: GitHub repository maintainers
- Security issues: Report through responsible disclosure

---

🎉 **Congratulations!** You now have WenXin MoYun running on Google Cloud Platform with enterprise-grade reliability, security, and observability.