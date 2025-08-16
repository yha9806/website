#!/bin/bash

# WenXin MoYun - Google Cloud Platform Setup Script
# This script helps configure the required IAM permissions for GitHub Actions deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="wenxin-moyun-prod"
SERVICE_ACCOUNT="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
REGION="asia-east1"
REPO_NAME="wenxin-images"

echo -e "${BLUE}🚀 WenXin MoYun - GCP Setup Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI not found. Please install it first:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with Google Cloud. Please run:${NC}"
    echo "   gcloud auth login"
    exit 1
fi

echo -e "${GREEN}✅ Google Cloud CLI is ready${NC}"
echo ""

# Set the project
echo -e "${BLUE}📋 Setting up project: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}
echo ""

# Check if service account exists
echo -e "${BLUE}🔍 Checking service account: ${SERVICE_ACCOUNT}${NC}"
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT} --quiet >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Service account exists${NC}"
else
    echo -e "${YELLOW}📝 Creating service account...${NC}"
    gcloud iam service-accounts create github-actions \
        --display-name="GitHub Actions" \
        --description="Service account for GitHub Actions CI/CD"
    echo -e "${GREEN}✅ Service account created${NC}"
fi
echo ""

# Required IAM roles
echo -e "${BLUE}🔐 Configuring IAM roles...${NC}"
ROLES=(
    "roles/artifactregistry.admin"
    "roles/run.admin"
    "roles/cloudsql.admin"
    "roles/secretmanager.secretAccessor"
    "roles/storage.admin"
    "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
    echo -e "${YELLOW}  Adding role: ${role}${NC}"
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="${role}" \
        --quiet
done
echo -e "${GREEN}✅ IAM roles configured${NC}"
echo ""

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
APIS=(
    "artifactregistry.googleapis.com"
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "secretmanager.googleapis.com"
    "storage.googleapis.com"
    "cloudbuild.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo -e "${YELLOW}  Enabling: ${api}${NC}"
    gcloud services enable ${api} --quiet
done
echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

# Create Artifact Registry repository
echo -e "${BLUE}📦 Setting up Artifact Registry...${NC}"
if gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} --quiet >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Artifact Registry repository already exists${NC}"
else
    echo -e "${YELLOW}📝 Creating Artifact Registry repository...${NC}"
    gcloud artifacts repositories create ${REPO_NAME} \
        --repository-format=docker \
        --location=${REGION} \
        --description="WenXin MoYun Docker images repository"
    echo -e "${GREEN}✅ Artifact Registry repository created${NC}"
fi
echo ""

# Generate service account key
echo -e "${BLUE}🔑 Generating service account key...${NC}"
KEY_FILE="github-actions-key.json"
gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${SERVICE_ACCOUNT}
echo -e "${GREEN}✅ Service account key saved to: ${KEY_FILE}${NC}"
echo ""

# Instructions for GitHub Secrets
echo -e "${BLUE}📋 Next Steps - GitHub Secrets Configuration:${NC}"
echo -e "${YELLOW}1. Go to your GitHub repository settings${NC}"
echo -e "${YELLOW}2. Navigate to Secrets and Variables > Actions${NC}"
echo -e "${YELLOW}3. Add the following secrets:${NC}"
echo ""
echo -e "${GREEN}   GCP_SA_KEY${NC} = Contents of ${KEY_FILE}"
echo -e "${GREEN}   OPENAI_API_KEY${NC} = Your OpenAI API key"
echo -e "${GREEN}   ANTHROPIC_API_KEY${NC} = Your Anthropic API key"
echo ""
echo -e "${BLUE}📋 To get the key content for GitHub:${NC}"
echo -e "${YELLOW}   cat ${KEY_FILE} | base64 -w 0${NC}"
echo ""
echo -e "${RED}⚠️  SECURITY: Delete ${KEY_FILE} after adding to GitHub Secrets!${NC}"
echo -e "${RED}   rm ${KEY_FILE}${NC}"
echo ""

# Verification
echo -e "${BLUE}🔍 Setup Verification:${NC}"
echo -e "${GREEN}✅ Project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}✅ Service Account: ${SERVICE_ACCOUNT}${NC}"
echo -e "${GREEN}✅ Region: ${REGION}${NC}"
echo -e "${GREEN}✅ Artifact Registry: ${REPO_NAME}${NC}"
echo ""
echo -e "${GREEN}🎉 GCP setup completed successfully!${NC}"
echo -e "${BLUE}   GitHub Actions should now be able to deploy to GCP.${NC}"