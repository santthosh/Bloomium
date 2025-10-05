# 🚀 Bloomium Deployment Guide

Complete guide for deploying Bloomium to Google Cloud Platform.

---

## Prerequisites

1. **Google Cloud Project**
   ```bash
   gcloud projects create bloomium-prod
   gcloud config set project bloomium-prod
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable pubsub.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Create Storage Bucket**
   ```bash
   gsutil mb -l us-central1 gs://bloomium-tiles
   gsutil cors set cors.json gs://bloomium-tiles
   ```

4. **Create Firestore Database**
   ```bash
   gcloud firestore databases create --region=us-central1
   ```

---

## Deploy API Service

```bash
cd apps/api

# Build and deploy to Cloud Run
gcloud run deploy bloomium-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MODE=cloud,GCS_BUCKET=bloomium-tiles,GCP_PROJECT_ID=bloomium-prod \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10

# Get the service URL
gcloud run services describe bloomium-api --region us-central1 --format 'value(status.url)'
```

---

## Deploy Web Service

```bash
cd apps/web

# Update environment variable with API URL
API_URL=$(gcloud run services describe bloomium-api --region us-central1 --format 'value(status.url)')

# Deploy to Cloud Run
gcloud run deploy bloomium-web \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=$API_URL \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10
```

---

## Deploy Worker as Cloud Run Job

```bash
cd apps/worker

# Create Cloud Run Job
gcloud run jobs create bloomium-worker \
  --source . \
  --region us-central1 \
  --set-env-vars MODE=cloud,GCS_BUCKET=bloomium-tiles,GCP_PROJECT_ID=bloomium-prod \
  --memory 1Gi \
  --cpu 2 \
  --timeout 30m \
  --max-retries 3

# Execute job manually
gcloud run jobs execute bloomium-worker \
  --region us-central1 \
  --args="--aoi-id=demo-aoi-1"
```

---

## Set Up Pub/Sub for Job Triggering

```bash
# Create topic
gcloud pubsub topics create bloom-jobs

# Create subscription
gcloud pubsub subscriptions create bloom-jobs-sub \
  --topic bloom-jobs

# Grant Cloud Run permissions
gcloud run services add-iam-policy-binding bloomium-api \
  --region us-central1 \
  --member serviceAccount:service-YOUR-PROJECT-NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com \
  --role roles/run.invoker
```

---

## Configure Cloud CDN (Optional)

```bash
# Create backend bucket
gcloud compute backend-buckets create bloomium-tiles-backend \
  --gcs-bucket-name bloomium-tiles \
  --enable-cdn

# Create URL map
gcloud compute url-maps create bloomium-cdn \
  --default-backend-bucket bloomium-tiles-backend

# Create HTTP(S) proxy
gcloud compute target-http-proxies create bloomium-proxy \
  --url-map bloomium-cdn

# Create global forwarding rule
gcloud compute forwarding-rules create bloomium-cdn-rule \
  --global \
  --target-http-proxy bloomium-proxy \
  --ports 80
```

---

## Environment Variables Summary

### API Service
```bash
MODE=cloud
GCS_BUCKET=bloomium-tiles
GCP_PROJECT_ID=bloomium-prod
GCP_REGION=us-central1
FIRESTORE_COLLECTION_AOIS=aois
FIRESTORE_COLLECTION_JOBS=jobs
```

### Web Service
```bash
NEXT_PUBLIC_API_URL=https://bloomium-api-XXXXX.run.app
```

### Worker Job
```bash
MODE=cloud
GCS_BUCKET=bloomium-tiles
GCP_PROJECT_ID=bloomium-prod
STORAGE_PATH=gs://bloomium-tiles
```

---

## Scheduled Jobs (Cloud Scheduler)

```bash
# Create weekly job to process new data
gcloud scheduler jobs create http bloom-weekly-job \
  --location us-central1 \
  --schedule "0 2 * * 1" \
  --uri "https://bloomium-api-XXXXX.run.app/run" \
  --http-method POST \
  --message-body '{"aoi_id":"demo-aoi-1"}' \
  --headers "Content-Type=application/json"
```

---

## Monitoring & Logging

### View Logs
```bash
# API logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bloomium-api" --limit 50

# Worker logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=bloomium-worker" --limit 50
```

### Create Alerts
```bash
# High error rate alert
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Bloomium High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## Cost Optimization

1. **Set scaling limits**
   ```bash
   gcloud run services update bloomium-api \
     --max-instances 10 \
     --min-instances 0
   ```

2. **Enable lifecycle policies on GCS**
   ```json
   {
     "lifecycle": {
       "rule": [{
         "action": {"type": "Delete"},
         "condition": {"age": 365}
       }]
     }
   }
   ```

3. **Use Cloud CDN** for tile caching to reduce egress costs

4. **Set bucket to Standard storage** for frequently accessed tiles

---

## Security Best Practices

1. **Use IAM for service authentication**
   ```bash
   gcloud run services remove-iam-policy-binding bloomium-api \
     --member="allUsers" \
     --role="roles/run.invoker"
   
   gcloud run services add-iam-policy-binding bloomium-api \
     --member="serviceAccount:your-service@project.iam.gserviceaccount.com" \
     --role="roles/run.invoker"
   ```

2. **Enable VPC connector** for private communication

3. **Use Secret Manager** for sensitive configs
   ```bash
   echo -n "your-api-key" | gcloud secrets create api-key --data-file=-
   
   gcloud run services update bloomium-api \
     --update-secrets=API_KEY=api-key:latest
   ```

4. **Set CORS policies** appropriately
   ```bash
   gsutil cors set cors.json gs://bloomium-tiles
   ```

---

## Rollback Strategy

```bash
# List revisions
gcloud run revisions list --service bloomium-api --region us-central1

# Rollback to previous revision
gcloud run services update-traffic bloomium-api \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

---

## CI/CD with Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build API
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'apps/api/Dockerfile', '-t', 'gcr.io/$PROJECT_ID/bloomium-api', '.']
  
  # Push API
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/bloomium-api']
  
  # Deploy API
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - gcloud
      - run
      - deploy
      - bloomium-api
      - --image=gcr.io/$PROJECT_ID/bloomium-api
      - --region=us-central1
```

Connect to GitHub:
```bash
gcloud builds triggers create github \
  --repo-name=bloomium \
  --repo-owner=YOUR_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
gcloud run services logs read bloomium-api --region us-central1

# Check service details
gcloud run services describe bloomium-api --region us-central1
```

### Tiles not loading
```bash
# Check bucket permissions
gsutil iam get gs://bloomium-tiles

# Test API endpoint
curl https://bloomium-api-XXXXX.run.app/healthz
```

### Worker job fails
```bash
# Check job execution history
gcloud run jobs executions list --job bloomium-worker --region us-central1

# View execution logs
gcloud run jobs executions describe EXECUTION_ID --region us-central1
```

---

## Custom Domain Setup

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service bloomium-web \
  --domain bloomium.space \
  --region us-central1

# Get DNS records to configure
gcloud run domain-mappings describe \
  --domain bloomium.space \
  --region us-central1
```

---

## Production Checklist

- [ ] Enable Cloud CDN
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Enable audit logging
- [ ] Set resource quotas
- [ ] Configure CORS properly
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Document runbooks
- [ ] Test disaster recovery

---

**Next Steps:**
1. Deploy services following the steps above
2. Monitor initial performance
3. Adjust scaling parameters as needed
4. Set up production monitoring dashboards

