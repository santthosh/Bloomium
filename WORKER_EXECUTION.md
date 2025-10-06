# 🔧 Worker Execution Guide

Guide for running the Bloomium worker to generate tiles for AOIs.

---

## Overview

The worker is deployed as a **Cloud Run Job** but does NOT run automatically on deployment. You need to trigger it manually or set up scheduled execution.

---

## Quick Start: Run Worker for All AOIs

```bash
# Execute the worker job
gcloud run jobs execute bloomium-worker \
  --region=us-central1 \
  --wait

# Monitor execution
gcloud run jobs executions list --job=bloomium-worker --region=us-central1
```

The worker will process all fixture files in `apps/worker/fixtures/`:
- `california-central-valley.json`
- `japan-agricultural.json`
- `south-africa-wine-lands.json`

---

## Run Worker for Specific AOI

To process a specific AOI, you can override the command:

```bash
# Process only Japan AOI
gcloud run jobs execute bloomium-worker \
  --region=us-central1 \
  --args="japan-agricultural" \
  --wait

# Process only California AOI
gcloud run jobs execute bloomium-worker \
  --region=us-central1 \
  --args="california-central-valley" \
  --wait

# Process only South Africa AOI
gcloud run jobs execute bloomium-worker \
  --region=us-central1 \
  --args="south-africa-wine-lands" \
  --wait
```

---

## View Worker Logs

```bash
# Get latest execution
EXECUTION_ID=$(gcloud run jobs executions list \
  --job=bloomium-worker \
  --region=us-central1 \
  --limit=1 \
  --format='value(name)')

# View logs
gcloud logging read "resource.labels.job_name=bloomium-worker AND resource.labels.location=us-central1" \
  --limit=100 \
  --format=json

# Or use Cloud Console
echo "View logs at: https://console.cloud.google.com/run/jobs/details/us-central1/bloomium-worker/executions?project=bloomium"
```

---

## Automated Scheduling (Optional)

### Set Up Daily Execution

Run worker every day at 2 AM UTC:

```bash
# Get the project number
PROJECT_NUMBER=$(gcloud projects describe bloomium --format='value(projectNumber)')

# Create Cloud Scheduler job
gcloud scheduler jobs create http bloomium-worker-daily \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/bloomium/jobs/bloomium-worker:run" \
  --http-method=POST \
  --oauth-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --description="Daily execution of Bloomium worker to generate tiles"

# Test the scheduler immediately
gcloud scheduler jobs run bloomium-worker-daily --location=us-central1
```

### Set Up Weekly Execution

Run worker every Monday at 3 AM UTC:

```bash
gcloud scheduler jobs create http bloomium-worker-weekly \
  --location=us-central1 \
  --schedule="0 3 * * 1" \
  --time-zone="UTC" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/bloomium/jobs/bloomium-worker:run" \
  --http-method=POST \
  --oauth-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --description="Weekly execution of Bloomium worker"
```

### Custom Cron Schedule Examples

```bash
# Every 6 hours
--schedule="0 */6 * * *"

# Every Monday and Thursday at 4 AM
--schedule="0 4 * * 1,4"

# First day of every month at midnight
--schedule="0 0 1 * *"

# Every hour during business hours (9 AM - 5 PM) on weekdays
--schedule="0 9-17 * * 1-5"
```

### Manage Scheduled Jobs

```bash
# List all schedulers
gcloud scheduler jobs list --location=us-central1

# Pause scheduler
gcloud scheduler jobs pause bloomium-worker-daily --location=us-central1

# Resume scheduler
gcloud scheduler jobs resume bloomium-worker-daily --location=us-central1

# Delete scheduler
gcloud scheduler jobs delete bloomium-worker-daily --location=us-central1
```

---

## Local Testing

Run the worker locally before deploying:

```bash
cd /Users/santthosh/Desktop/Projects/bloomium

# Run with local data
docker-compose up worker

# Or run directly with Node
cd apps/worker
npm install
MODE=local npm start
```

---

## Worker Configuration

Current worker settings (from GitHub Actions):

```yaml
Memory: 2Gi
CPU: 2
Max Retries: 3
Task Timeout: 30m
```

### Adjust Resources

If worker runs out of memory or times out:

```bash
gcloud run jobs update bloomium-worker \
  --region=us-central1 \
  --memory=4Gi \
  --cpu=4 \
  --task-timeout=60m
```

---

## Monitoring

### Check Job Status

```bash
# List recent executions
gcloud run jobs executions list \
  --job=bloomium-worker \
  --region=us-central1 \
  --limit=10

# Describe specific execution
gcloud run jobs executions describe EXECUTION_NAME \
  --region=us-central1
```

### Check Generated Tiles

```bash
# List tiles in GCS bucket
gsutil ls gs://bloomium-tiles/

# Check tiles for specific AOI
gsutil ls gs://bloomium-tiles/california-central-valley/

# Download sample tile
gsutil cp gs://bloomium-tiles/california-central-valley/bloom/2025-09-01/10/163/396.png .
```

### Verify API Access

```bash
# Check if tiles are accessible via API
API_URL=$(gcloud run services describe bloomium-api --region=us-central1 --format='value(status.url)')

curl "${API_URL}/tiles/california-central-valley/bloom/2025-09-01/10/163/396.png" -I
```

---

## Troubleshooting

### Worker Job Fails

1. **Check logs:**
   ```bash
   gcloud logging read "resource.labels.job_name=bloomium-worker" --limit=50
   ```

2. **Common issues:**
   - **Out of memory:** Increase `--memory` (see Adjust Resources above)
   - **Timeout:** Increase `--task-timeout`
   - **Permission errors:** Check service account has Storage Admin role
   - **Missing fixtures:** Verify fixture JSON files exist in `apps/worker/fixtures/`

### Tiles Not Appearing in Web UI

1. **Verify tiles exist:**
   ```bash
   gsutil ls gs://bloomium-tiles/california-central-valley/
   ```

2. **Check CORS configuration:**
   ```bash
   gsutil cors get gs://bloomium-tiles
   ```

3. **Test tile URL directly:**
   ```bash
   curl -I "${API_URL}/tiles/california-central-valley/bloom/2025-09-01/10/163/396.png"
   ```

### Adding New AOI

1. Create fixture JSON in `apps/worker/fixtures/`:
   ```json
   {
     "aoi_id": "new-region",
     "name": "New Region Name",
     "bbox": [lon_min, lat_min, lon_max, lat_max],
     "dates": ["2025-09-01", "2025-09-08"]
   }
   ```

2. Add to `apps/web/src/config/aois.ts`:
   ```typescript
   {
     id: 'new-region',
     name: 'New Region Name',
     center: [lat, lon],
     zoom: 10,
   }
   ```

3. Commit and push to trigger deployment

4. Run worker for new AOI:
   ```bash
   gcloud run jobs execute bloomium-worker \
     --region=us-central1 \
     --args="new-region" \
     --wait
   ```

---

## Summary

**After each deployment:**
1. Worker image is updated but NOT executed
2. Manually run: `gcloud run jobs execute bloomium-worker --region=us-central1 --wait`
3. Verify tiles generated: `gsutil ls gs://bloomium-tiles/`
4. Check Web UI to see new tiles

**For production:**
- Set up Cloud Scheduler for automated execution
- Monitor executions via Cloud Console
- Adjust resources based on AOI size and complexity

