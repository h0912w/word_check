# Cloud Run Deployment Script for Windows
# This script deploys the proxy server to Google Cloud Run

$ErrorActionPreference = "Stop"

$PROJECT_ID = ""
$REGION = "us-central1"
$SERVICE_NAME = "word-check-proxy"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Cloud Run Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
$gcloudExists = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudExists) {
    Write-Host "Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check if user is logged in
Write-Host "Checking gcloud authentication..."
$account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $account) {
    Write-Host "Not logged in. Please login..." -ForegroundColor Yellow
    gcloud auth login
}

# Get or set project ID
if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host ""
    Write-Host "Available Google Cloud projects:"
    gcloud projects list

    Write-Host ""
    $PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"

    if ([string]::IsNullOrEmpty($PROJECT_ID)) {
        Write-Host "Project ID is required" -ForegroundColor Red
        exit 1
    }
}

# Set project
Write-Host ""
Write-Host "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host ""
Write-Host "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create environment variables file for Cloud Run
Write-Host ""
Write-Host "Setting up environment variables..."
Write-Host "Please enter the following values from your .env.local file:"
Write-Host ""

$GOOGLE_ADS_DEVELOPER_TOKEN = Read-Host "GOOGLE_ADS_DEVELOPER_TOKEN"
$GOOGLE_ADS_CUSTOMER_ID = Read-Host "GOOGLE_ADS_CUSTOMER_ID"
$GOOGLE_ADS_LOGIN_CUSTOMER_ID = Read-Host "GOOGLE_ADS_LOGIN_CUSTOMER_ID (press Enter to skip)"
$GOOGLE_ADS_CLIENT_ID = Read-Host "GOOGLE_ADS_CLIENT_ID"
$GOOGLE_ADS_CLIENT_SECRET = Read-Host "GOOGLE_ADS_CLIENT_SECRET"
$GOOGLE_ADS_REFRESH_TOKEN = Read-Host "GOOGLE_ADS_REFRESH_TOKEN"
$API_SECRET = Read-Host "API_SECRET (generate with: openssl rand -hex 32)"

# Build and deploy
Write-Host ""
Write-Host "Building Docker image..."
gcloud builds submit --config cloudbuild.yaml .

# Set environment variables
Write-Host ""
Write-Host "Setting environment variables..."

$envVars = @(
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

if (-not [string]::IsNullOrEmpty($GOOGLE_ADS_LOGIN_CUSTOMER_ID)) {
    $envVars += "GOOGLE_ADS_LOGIN_CUSTOMER_ID=$GOOGLE_ADS_LOGIN_CUSTOMER_ID"
}

$envVarsString = $envVars -join ","

# Update Cloud Run service with environment variables
gcloud run services update word-check-proxy `
    --region=$REGION `
    --update-env-vars=$envVarsString

# Get service URL
$SERVICE_URL = gcloud run services describe word-check-proxy --region=$REGION --format="value(status.url)"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URL: $SERVICE_URL"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test health check: curl $SERVICE_URL/health"
Write-Host "2. Update .env.local with:"
Write-Host "   PROXY_SERVER_URL=$SERVICE_URL"
Write-Host "   PROXY_API_SECRET=$API_SECRET"
Write-Host "3. Deploy Worker: wrangler deploy"
Write-Host ""
