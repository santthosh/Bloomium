#!/bin/bash

# GitHub Actions Service Account Setup Script
# This script creates a service account and grants necessary permissions for CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 GitHub Actions Setup for Bloomium"
echo "======================================"
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project configured${NC}"
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo -e "${GREEN}Project:${NC} $PROJECT_ID"
echo ""

# Confirm
read -p "Create GitHub Actions service account for this project? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Service account details
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo ""
echo "📋 Creating service account..."

# Create service account
if gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null; then
  echo -e "${YELLOW}Service account already exists${NC}"
else
  gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions CI/CD" \
    --project=$PROJECT_ID
  echo -e "${GREEN}✓ Service account created${NC}"
fi

echo ""
echo "🔐 Granting permissions..."

# Grant roles
ROLES=(
  "roles/run.admin"
  "roles/storage.admin"
  "roles/iam.serviceAccountUser"
  "roles/artifactregistry.writer"
)

for role in "${ROLES[@]}"; do
  echo "  - $role"
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --quiet > /dev/null
done

echo -e "${GREEN}✓ Permissions granted${NC}"

echo ""
echo "🔑 Creating service account key..."

# Delete old key file if exists
if [ -f "$KEY_FILE" ]; then
  rm "$KEY_FILE"
fi

# Create key
gcloud iam service-accounts keys create $KEY_FILE \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

echo -e "${GREEN}✓ Key created: $KEY_FILE${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy the contents of $KEY_FILE:"
echo -e "   ${YELLOW}cat $KEY_FILE${NC}"
echo ""
echo "2. Go to your GitHub repository settings:"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo "3. Create a new repository secret:"
echo "   Name: GCP_SA_KEY"
echo "   Value: <paste the JSON content>"
echo ""
echo "4. Test the workflow:"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo "⚠️  Important: Delete the key file after adding to GitHub:"
echo -e "   ${YELLOW}rm $KEY_FILE${NC}"
echo ""
echo "🔗 Service Account: $SA_EMAIL"
echo ""

