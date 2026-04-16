#!/bin/bash

# Cloud Run Deployment Script
# This script deploys the proxy server to Google Cloud Run

set -e

PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="word-check-proxy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "Cloud Run Deployment Script"
echo "================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
echo "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}Not logged in. Please login...${NC}"
    gcloud auth login
fi

# Get or set project ID
if [ -z "$PROJECT_ID" ]; then
    echo ""
    echo "Available Google Cloud projects:"
    gcloud projects list

    echo ""
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID

    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Project ID is required${NC}"
        exit 1
    fi
fi

# Set project
echo ""
echo "Setting project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo ""
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create environment variables file for Cloud Run
echo ""
echo "Setting up environment variables..."
echo "Please enter the following values from your .env.local file:"
echo ""

read -p "GOOGLE_ADS_DEVELOPER_TOKEN: " GOOGLE_ADS_DEVELOPER_TOKEN
read -p "GOOGLE_ADS_CUSTOMER_ID: " GOOGLE_ADS_CUSTOMER_ID
read -p "GOOGLE_ADS_LOGIN_CUSTOMER_ID (press Enter to skip): " GOOGLE_ADS_LOGIN_CUSTOMER_ID
read -p "GOOGLE_ADS_CLIENT_ID: " GOOGLE_ADS_CLIENT_ID
read -p "GOOGLE_ADS_CLIENT_SECRET: " GOOGLE_ADS_CLIENT_SECRET
read -p "GOOGLE_ADS_REFRESH_TOKEN: " GOOGLE_ADS_REFRESH_TOKEN
read -p "API_SECRET (generate with: openssl rand -hex 32): " API_SECRET

# Build and deploy
echo ""
echo "Building Docker image..."
gcloud builds submit --config cloudbuild.yaml .

# Set environment variables
echo ""
echo "Setting environment variables..."
ENV_VARS=(
  "PORT=3001"
  "NODE_ENV=production"
  "GOOGLE_ADS_DEVELOPER_TOKEN=$GOOGLE_ADS_DEVELOPER_TOKEN"
  "GOOGLE_ADS_CUSTOMER_ID=$GOOGLE_ADS_CUSTOMER_ID"
  "GOOGLE_ADS_CLIENT_ID=$GOOGLE_ADS_CLIENT_ID"
  "GOOGLE_ADS_CLIENT_SECRET=$GOOGLE_ADS_CLIENT_SECRET"
  "GOOGLE_ADS_REFRESH_TOKEN=$GOOGLE_ADS_REFRESH_TOKEN"
  "API_SECRET=$API_SECRET"
  "WORKER_DOMAIN=*.workers.dev"
  "ALLOWED_ORIGINS=*.workers.dev"
)

if [ -n "$GOOGLE_ADS_LOGIN_CUSTOMER_ID" ]; then
  ENV_VARS+=("GOOGLE_ADS_LOGIN_CUSTOMER_ID=$GOOGLE_ADS_LOGIN_CUSTOMER_ID")
fi

# Update Cloud Run service with environment variables
gcloud run services update word-check-proxy \
  --region="$REGION" \
  --update-env-vars="$(IFS=,; echo "${ENV_VARS[*]}")"

# Get service URL
SERVICE_URL=$(gcloud run services describe word-check-proxy --region="$REGION" --format="value(status.url)")

echo ""
echo "================================"
echo -e "${GREEN}Deployment completed!${NC}"
echo "================================"
echo ""
echo "Service URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "1. Test health check: curl $SERVICE_URL/health"
echo "2. Update .env.local with:"
echo "   PROXY_SERVER_URL=$SERVICE_URL"
echo "   PROXY_API_SECRET=$API_SECRET"
echo "3. Deploy Worker: wrangler deploy"
echo ""
