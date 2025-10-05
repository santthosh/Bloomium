# 🪷 Bloomium — Monorepo Specification

**Purpose:**  
Bloomium is a web-based platform that visualizes **global flowering phenology** using Earth observation data (e.g., Sentinel-2).  
Users can explore bloom maps for any region, compare weeks, and see anomalies and time series insights.

The stack is **TypeScript-only**, optimized for **local-first development** (no emulators) and **Google Cloud serverless deployment** (Cloud Run + GCS + Firestore + Pub/Sub).

---

## 🧭 Project Overview

### High-Level Goal
Create a **real-time bloom observation platform** that:
1. Lets users select or draw an **Area of Interest (AOI)**.  
2. Displays **bloom probability** and **anomaly maps** by date.  
3. Provides **per-pixel charts** (time series of indices) and **explanations**.  
4. Can be run locally and deployed serverlessly.

---

## 🏗️ Architecture Overview

| Layer | Component | Purpose | Runs |
|-------|------------|----------|------|
| **Web UI** | `apps/web` (Next.js) | Map interface, date slider, overlays, charts | Browser / Cloud Run / Vercel |
| **API Service** | `apps/api` (Express) | Serves tiles, metadata, timeseries, explain; manages AOIs | Cloud Run |
| **Worker** | `apps/worker` (Node CLI) | Generates tiles from raw data (stubbed locally) | Local or Cloud Run Job |
| **Storage** | `local-data` or GCS | Stores COGs, PNG tiles, metadata | Disk / GCS bucket |
| **State** | JSON files or Firestore | Job status, AOIs | Local / Firestore |
| **Queue** | Direct call or Pub/Sub | Job scheduling | Local / Pub/Sub |

---

## 🧩 Folder Structure

```
bloomium/
  apps/
    web/        # Next.js frontend
    api/        # Express API
    worker/     # Tile generator / processor
  local-data/   # Output data (local mode only)
  package.json  # Workspaces config
  .env.local    # Shared environment variables
  REQUIREMENTS.md
```

---

## ⚙️ Core Features by Module

### `apps/web` — Web UI (Next.js)

**Purpose:** interactive user interface for bloom maps.

#### Features
- Map visualization using **Leaflet** or **MapLibre**.
- Tile overlays: `/tiles/bloom/{z}/{x}/{y}` and `/tiles/anomaly/...`.
- Date picker or slider to navigate weekly data.
- Layer toggle between “Bloom” and “Anomaly.”
- Click interaction → fetch `/timeseries` and `/explain`.
- Branding: Bloomium logo, tagline, color scheme.

#### APIs Consumed
- `POST /aoi/resolve`
- `GET /tiles/:layer/:z/:x/:y`
- `GET /timeseries?lat&lon&aoi_id`
- `GET /explain?lat&lon&date`

#### Key Libraries
- `next`, `react`, `react-leaflet`, `leaflet`
- `zod` (optional for schema validation)
- `axios` or native `fetch`

---

### `apps/api` — Backend API (Express)

**Purpose:** serves data to web, manages AOIs, exposes tiles and metrics.

#### Routes
| Method | Path | Description |
|---------|------|--------------|
| `GET` | `/healthz` | Health check |
| `POST` | `/aoi/resolve` | Normalize a name or bbox → returns `aoi_id` |
| `GET` | `/tiles/:layer/:z/:x/:y` | Streams precomputed PNG tile |
| `GET` | `/timeseries` | Returns per-pixel indices over time |
| `GET` | `/explain` | Returns z-score, delta, confidence |
| `POST` | `/run` *(future)* | Triggers job (Pub/Sub or local) |

#### Data Expectations
```
local-data/{aoi_id}/{date}/
  tiles/bloom/{z}/{x}/{y}.png
  tiles/anomaly/{z}/{x}/{y}.png
  meta.json
  timeseries.json
```

---

### `apps/worker` — Tile Generator

**Purpose:** generate bloom/anomaly tiles and metadata from data sources.  
In local dev, it writes **fake demo tiles** (gradients).  
Later: compute **ARI (Anthocyanin Reflectance Index)** and **ΔARI** from Sentinel-2 imagery.

#### CLI Usage
```bash
pnpm dev -- --aoi ./fixtures/demo-aoi-1.json
```

#### Inputs
```json
{
  "aoi_id": "demo-aoi-1",
  "bbox": [-121.5, 38.2, -121.0, 38.6],
  "dates": ["2025-09-01", "2025-09-08"]
}
```

#### Outputs
```
local-data/demo-aoi-1/2025-09-01/tiles/bloom/6/0/0.png
local-data/demo-aoi-1/2025-09-08/tiles/anomaly/6/0/0.png
local-data/demo-aoi-1/2025-09-01/meta.json
```

---

## 🧪 Local Development Setup

### Steps
```bash
cd apps/worker && npx tsx src/index.ts --aoi fixtures/demo-aoi-1.json
pnpm --filter @bloomium/api dev
pnpm --filter @bloomium/web dev
```

---

## ☁️ Cloud Deployment (GCP)

| Service | Component | Description |
|----------|------------|--------------|
| **Cloud Run** | `web`, `api`, `worker` | Containerized web/API/worker |
| **Cloud Storage (GCS)** | Tiles/COGs | Long-term storage for bloom maps |
| **Firestore** | AOIs + job status | State store |
| **Pub/Sub** | Job queue | Triggers worker jobs |
| **Cloud CDN** | Tile caching | Faster global delivery |

---

## ✅ Acceptance Criteria
- [ ] Web shows bloom/anomaly tiles
- [ ] API serves `/healthz`, `/tiles`, `/timeseries`, `/explain`
- [ ] Worker generates correct tile structure
- [ ] Project runs via `pnpm dev:all`
