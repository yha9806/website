# 🚨 URGENT: Manual GCP Setup Required

## Current Issue
GitHub Actions deployment is failing with permission error:
```
denied: Permission "artifactregistry.repositories.uploadArtifacts" denied on resource "projects/wenxin-moyun-prod/locations/asia-east1/repositories/wenxin-images"
```

## Required Immediate Actions

### Option 1: Run Automated Setup Script (Recommended)
```bash
# On your local machine with gcloud CLI installed and authenticated:
git pull origin master
chmod +x scripts/setup-gcp-permissions.sh
./scripts/setup-gcp-permissions.sh
```

### Option 2: Manual Google Cloud Console Configuration

#### Step 1: Check Service Account
1. Go to [Google Cloud Console - IAM](https://console.cloud.google.com/iam-admin/iam)
2. Select project: `wenxin-moyun-prod`
3. Find service account: `github-actions@wenxin-moyun-prod.iam.gserviceaccount.com`

#### Step 2: Add Required Roles
Add these roles to the service account:
- ✅ **Artifact Registry Administrator** (`roles/artifactregistry.admin`)
- ✅ **Cloud Run Admin** (`roles/run.admin`)
- ✅ **Cloud SQL Admin** (`roles/cloudsql.admin`)
- ✅ **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`)
- ✅ **Storage Admin** (`roles/storage.admin`)
- ✅ **Service Account User** (`roles/iam.serviceAccountUser`)

#### Step 3: Create Artifact Registry Repository
1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Click "Create Repository"
3. Name: `wenxin-images`
4. Format: Docker
5. Location: `asia-east1`
6. Description: "WenXin MoYun Docker images repository"

#### Step 4: Enable APIs
Enable these APIs in [API Library](https://console.cloud.google.com/apis/library):
- Artifact Registry API
- Cloud Run API
- Cloud SQL Admin API
- Secret Manager API
- Cloud Storage API
- Cloud Build API

### Option 3: Quick Command Line Fix
If you have gcloud CLI access with admin permissions:

```bash
# Set project
gcloud config set project wenxin-moyun-prod

# Add IAM roles
SA_EMAIL="github-actions@wenxin-moyun-prod.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding wenxin-moyun-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding wenxin-moyun-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding wenxin-moyun-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Create Artifact Registry repository
gcloud artifacts repositories create wenxin-images \
  --repository-format=docker \
  --location=asia-east1 \
  --description="WenXin MoYun Docker images repository"

# Enable APIs
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
```

## Verification
After setup, trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger deployment after GCP setup"
git push origin master
```

The GitHub Actions should now succeed.

## Root Cause
The service account `github-actions@wenxin-moyun-prod.iam.gserviceaccount.com` was created but not assigned the necessary IAM roles for Artifact Registry operations.

## Status
- ❌ Current: Permission denied for artifact uploads
- ✅ Solution: Run setup script or manual IAM configuration
- ✅ Target: Successful Docker push and Cloud Run deployment