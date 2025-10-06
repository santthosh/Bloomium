# ✅ Cloud Build Setup Checklist

## Status: In Progress

### ✅ Completed Steps:
1. ✅ Enabled Cloud Build API
2. ✅ Enabled Cloud Run API
3. ✅ Enabled Storage API
4. ✅ Granted Cloud Build permissions
5. ✅ Created/verified GCS bucket (bloomium-tiles)
6. ✅ Updated cloudbuild.yaml with env vars

### 🔄 Current Step: Connect GitHub Repository

**Browser should be open at:** https://console.cloud.google.com/cloud-build/triggers?project=bloomium

**Follow these steps in the console:**

1. **Click** `CREATE TRIGGER`

2. **Select Source:**
   - Choose: **GitHub (Cloud Build GitHub App)**
   - Click: `CONNECT NEW REPOSITORY`

3. **Authenticate:**
   - Sign in to GitHub (if not already)
   - Select your account: **santthosh**
   - Install Google Cloud Build app if prompted
   - Select repository: **Bloomium**
   - Click: `CONNECT`

4. **Configure Trigger:**
   ```
   Name: bloomium-main-deploy
   Description: Deploy Bloomium on push to main branch
   
   Event: Push to a branch
   Source Repository: santthosh/Bloomium
   Branch: ^main$
   
   Configuration:
     Type: Cloud Build configuration file (yaml or json)
     Location: cloudbuild.yaml
   
   Advanced (Optional):
     Substitution variables: (leave empty)
     Service account: Default Cloud Build service account
   ```

5. **Click** `CREATE`

---

## After Trigger is Created:

### Test the Setup

**Option 1: Manual trigger**
```bash
# Trigger a build manually to test
gcloud builds triggers run bloomium-main-deploy --branch=main
```

**Option 2: Push to GitHub**
```bash
# Make a small change and push
git commit --allow-empty -m "test: trigger cloud build"
git push origin main
```

### Monitor Build Progress

```bash
# View recent builds
gcloud builds list --limit=5

# Stream logs from latest build
gcloud builds log --stream $(gcloud builds list --limit=1 --format='value(id)')
```

**Or view in Console:**
https://console.cloud.google.com/cloud-build/builds?project=bloomium

---

## Expected Build Time

- **First build:** 8-12 minutes (downloads base images)
- **Subsequent builds:** 5-8 minutes (uses cache)

---

## After First Successful Build:

Your services will be available at:

```bash
# Get service URLs
gcloud run services list --region=us-central1
```

**Expected URLs:**
- API: https://bloomium-api-XXXXX-uc.a.run.app
- Web: https://bloomium-web-XXXXX-uc.a.run.app

**Test them:**
```bash
# Test API
curl $(gcloud run services describe bloomium-api --region=us-central1 --format='value(status.url)')/healthz

# Test Web (opens in browser)
open $(gcloud run services describe bloomium-web --region=us-central1 --format='value(status.url)')
```

---

## Next: Configure Custom Domain

Once the build succeeds, proceed to **DOMAIN_SETUP.md** starting at **Phase 2**.

Quick command:
```bash
cat DOMAIN_SETUP.md | grep -A 50 "Phase 2"
```

---

## Troubleshooting

### Build Fails
```bash
# View detailed logs
gcloud builds describe BUILD_ID --region=us-central1

# Common issues:
# - Permissions: Re-run IAM grant commands
# - Dockerfile errors: Check Dockerfile syntax
# - Out of memory: Increase machine type in cloudbuild.yaml
```

### Can't Connect GitHub
- Make sure you're signed into the correct GitHub account
- Check GitHub App permissions: https://github.com/settings/installations
- Try disconnecting and reconnecting

### Permissions Issues
```bash
# Re-grant permissions if needed
PROJECT_NUMBER=$(gcloud projects describe bloomium --format='value(projectNumber)')

gcloud projects add-iam-policy-binding bloomium \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding bloomium \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## Summary

✅ **Setup completed:** APIs enabled, permissions granted
🔄 **In progress:** GitHub connection
⏳ **Next:** Configure custom domain (bloomium.space)

**When you see "DONE" status in Cloud Build console, you're ready for domain setup!**

