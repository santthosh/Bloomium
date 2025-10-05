# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automated deployment to Google Cloud.

## Prerequisites

- Google Cloud Project: `bloomium`
- GitHub repository with admin access
- `gcloud` CLI installed and authenticated

---

## Step 1: Create a Service Account

Create a dedicated service account for GitHub Actions:

```bash
# Set your project ID
export PROJECT_ID="bloomium"

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD" \
  --project=$PROJECT_ID

# Get the service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Service Account: $SA_EMAIL"
```

---

## Step 2: Grant Required Permissions

Grant the service account necessary permissions:

```bash
# Cloud Run Admin (deploy services)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

# Storage Admin (push Docker images to GCR)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"

# Service Account User (deploy as Cloud Run services)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry Writer (push images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"
```

---

## Step 3: Create Service Account Key

Create and download a JSON key file:

```bash
# Create key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

# Display the key (you'll need this for GitHub)
cat github-actions-key.json
```

⚠️ **Important:** Keep this key secure! Don't commit it to Git.

---

## Step 4: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GCP_SA_KEY`
5. Value: Paste the entire contents of `github-actions-key.json`
6. Click **Add secret**

---

## Step 5: Test the Workflow

### Option A: Trigger on Push

Simply push to the `main` branch:

```bash
git push origin main
```

### Option B: Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Google Cloud**
3. Click **Run workflow** → **Run workflow**

---

## Workflow Overview

### `deploy.yml`

The deployment workflow builds and deploys all services efficiently:
- ✅ **Parallel image builds** - All 3 images build simultaneously (~3x faster)
- ✅ **Smart dependencies** - API deploys first, then Web (needs API URL) and Worker in parallel
- ✅ **Efficient resource usage** - Uses GitHub's parallel runners
- ✅ **Clear status** - Matrix strategy shows each service separately
- ✅ **Fast feedback** - Fails fast if any build fails

**Architecture:**
1. Build all images in parallel (API, Web, Worker)
2. Deploy API first
3. Deploy Web (using API URL) and Worker in parallel
4. Generate deployment summary

---

## Workflow Triggers

Both workflows trigger on:

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Manual dispatch:**
   - Go to Actions tab
   - Select workflow
   - Click "Run workflow"

---

## Environment Variables

Update these in the workflow files if needed:

```yaml
env:
  PROJECT_ID: bloomium          # Your GCP project ID
  REGION: us-central1           # Cloud Run region
  GCS_BUCKET: bloomium-tiles    # GCS bucket name
```

---

## Monitoring Deployments

### View Logs

1. Go to **Actions** tab in GitHub
2. Click on the running/completed workflow
3. Click on individual jobs to see logs

### Check Deployment Status

```bash
# API status
gcloud run services describe bloomium-api --region=us-central1

# Web status
gcloud run services describe bloomium-web --region=us-central1

# Worker job status
gcloud run jobs describe bloomium-worker --region=us-central1
```

---

## Troubleshooting

### "Permission denied" errors

Make sure the service account has all required roles:
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL"
```

### "Image not found" errors

Verify GCR authentication:
```bash
gcloud auth configure-docker gcr.io
```

### Deployment timeout

Increase timeout in workflow:
```yaml
--timeout=120s
```

### Service fails to start

Check Cloud Run logs:
```bash
gcloud run services logs read bloomium-api --region=us-central1 --limit=50
```

---

## Security Best Practices

1. **Rotate keys regularly:**
   ```bash
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=$SA_EMAIL
   
   # Create new key
   gcloud iam service-accounts keys create new-key.json \
     --iam-account=$SA_EMAIL
   ```

2. **Use Workload Identity Federation (Advanced):**
   - More secure than service account keys
   - No long-lived credentials
   - See: https://github.com/google-github-actions/auth#workload-identity-federation

3. **Limit permissions:**
   - Only grant necessary roles
   - Use separate service accounts for different environments

---

## Cleanup

To remove the service account key after setup:

```bash
rm github-actions-key.json
```

To delete the service account (if needed):

```bash
gcloud iam service-accounts delete $SA_EMAIL --project=$PROJECT_ID
```

---

## Next Steps

1. ✅ Complete steps 1-4 above
2. ✅ Test deployment with a small change
3. ✅ Monitor the Actions tab for deployment status
4. ✅ Visit your deployed app!

**Live URLs:**
- 🌐 Web: https://bloomium-web-569323643033.us-central1.run.app
- 🔌 API: https://bloomium-api-569323643033.us-central1.run.app

---

## Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Cloud Run CI/CD Guide](https://cloud.google.com/run/docs/continuous-deployment-with-cloud-build)

