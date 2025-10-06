# 🧠 Bloomium — System Design & Deployment Topology

## Overview
Bloomium is a TypeScript monorepo with three main services (`web`, `api`, `worker`) that interact through shared local or cloud storage.  
It runs locally with no dependencies and scales serverlessly on Google Cloud Run.

---

## System Diagram

```text
          +------------------+
          |   Web (Next.js)  |
          |  bloomium.space  |
          +---------+--------+
                    |
                    v
          +------------------+
          |  API (Express)   |
          | api.bloomium.space |
          +------------------+
            |      ^      |
   tiles ↓  |      |      | ↑ /run
            v      |      |
        [GCS or local-data]  <--- Worker (Node.js Job)
```

---

## Components

### 1️⃣ Web (Next.js)
- Renders maps, overlays, charts.
- Calls API endpoints.
- Deployed on **Vercel** or **Cloud Run**.

### 2️⃣ API (Express)
- Serves precomputed tiles and timeseries data.
- Exposes REST endpoints.
- Reads from GCS or local disk.
- Deployed on **Cloud Run**.

### 3️⃣ Worker (Node.js Job)
- Generates bloom/anomaly data from Sentinel-2.
- Runs periodically or on-demand (via `/run` or Pub/Sub).
- Writes outputs to GCS or `./local-data`.

---

## Data Flow (Simplified)

1. User selects region (AOI).  
2. Web sends `/aoi/resolve` → API creates AOI ID.  
3. User triggers `/run` → API enqueues job.  
4. Worker fetches satellite data, computes ARI/anomaly.  
5. Worker writes output:  
   - PNG tiles for bloom/anomaly  
   - meta.json + timeseries.json  
6. Web loads tiles from GCS through API or CDN.

---

## Storage Layout

```
/data or gs://bloomium-tiles/
  {aoi_id}/
    {date}/
      tiles/
        bloom/{z}/{x}/{y}.png
        anomaly/{z}/{x}/{y}.png
      meta.json
      timeseries.json
```

---

## Cloud Architecture (Production)

| Service | Role | Description |
|----------|------|-------------|
| **Cloud Run** | API + Web + Worker | Scalable, stateless containers |
| **GCS** | Storage | COGs, PNGs, metadata |
| **Firestore** | Database | AOI + job state |
| **Pub/Sub** | Queue | Job scheduling |
| **Cloud CDN** | Caching | Serve tiles fast |
| **Workflows** *(optional)* | Orchestration | Auto-start Cloud Run Jobs |

---

## Local Mode
- Uses local `./local-data` instead of GCS.  
- AOIs and jobs stored as JSON files.  
- Worker runs manually.  
- All services run with `pnpm dev:all`.

---

## Security & Scaling
- Cloud Run provides HTTPS and auto-scaling.  
- Public GCS bucket or signed URLs for tiles.  
- CORS restricted to `bloomium.space`.  
- Jobs isolated per AOI/date for parallel execution.

---

## Future Enhancements
- Add ML-based anomaly detection.
- Add iNaturalist photo integration.
- Enable multi-region processing.
- Build admin dashboard for monitoring job health.

---

## Deployment Topology (Cloud)

```
Cloud Run (web)  --->  Cloud CDN  --->  End Users
                          |
Cloud Run (api)  --->  GCS (tiles, meta)
       ^                    ^
       | Pub/Sub             |
Cloud Run (worker job)  ----+
       |
   Firestore (AOIs, jobs)
```

---

**Deployment Notes:**
- Deploy with `gcloud run deploy` per app.
- Use `gcloud pubsub topics publish` to trigger jobs.
- Use `bloomium-prod` project and `us-central1` region by default.

---
