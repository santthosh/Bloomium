<div align="center">

<img src="apps/web/public/bloomium-logo-flower.png" alt="Bloomium Logo" width="200"/>

# 🪷 Bloomium

**Global Flowering Phenology Visualization Platform**

[![Deploy to Google Cloud](https://github.com/santthosh/Bloomium/actions/workflows/deploy.yml/badge.svg)](https://github.com/santthosh/Bloomium/actions/workflows/deploy.yml)
[![License: ELv2](https://img.shields.io/badge/License-ELv2-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

Bloomium uses Earth observation data (Sentinel-2) to visualize flowering patterns across the globe. Explore bloom maps, compare time periods, and analyze anomalies in real-time.

**🏆 Submitted to NASA Space Apps Challenge 2025**

[Demo](#-demo) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 🎬 Demo

![Bloomium Demo](docs/bloomium-demo.gif)

Bloomium provides an interactive map interface for exploring flowering patterns across multiple regions worldwide. The platform visualizes:
- **Bloom Probability Maps**: Real-time flowering detection using Anthocyanin Reflectance Index (ARI)
- **Anomaly Detection**: Statistical analysis highlighting unusual blooming patterns
- **Time Series Analysis**: Track flowering trends over multiple observation periods
- **Multi-Region Support**: Pre-configured areas including California's Central Valley, Japan's agricultural regions, and South Africa's wine lands

Click any location on the map to explore detailed time series data, statistical metrics, and AI-generated natural language explanations of flowering patterns.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 8

### Installation

```bash
# Install dependencies
pnpm install
```

### Local Development

Run all services locally:

```bash
# Terminal 1: Start worker and generate demo tiles
cd apps/worker && npx tsx src/index.ts --aoi fixtures/demo-aoi-1.json

# Terminal 2: Start API server (after worker finishes)
pnpm --filter @bloomium/api dev

# Terminal 3: Start web interface
pnpm --filter @bloomium/web dev
```

Or use the convenience scripts:

```bash
# Generate demo tiles first
pnpm generate:demo

# Then start API + Web
pnpm dev:all
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
bloomium/
├── apps/
│   ├── web/        # Next.js frontend
│   ├── api/        # Express API server
│   └── worker/     # Tile generator
├── local-data/     # Generated tiles (local mode)
├── REQUIREMENTS.md # Full specification
└── SYSTEM_DESIGN.md # Architecture docs
```

---

## 🧩 Architecture

| Component | Tech Stack | Purpose |
|-----------|-----------|---------|
| **Web** | Next.js, React, Leaflet, Tailwind | Interactive map UI |
| **API** | Express, TypeScript | REST API for tiles & data |
| **Worker** | Node.js, Sharp | Tile generation & processing |

**Data Flow:**
1. Worker generates bloom/anomaly tiles from satellite data
2. API serves tiles and metadata via REST endpoints
3. Web visualizes data on an interactive map

---

## 🛠️ Development

### Running Individual Services

```bash
# Worker (generate tiles)
cd apps/worker && npx tsx src/index.ts --aoi fixtures/demo-aoi-1.json

# API server
pnpm --filter @bloomium/api dev

# Web interface
pnpm --filter @bloomium/web dev
```

### Build for Production

```bash
# Build all services
pnpm build

# Build specific service
pnpm build:web
pnpm build:api
pnpm build:worker
```

### Type Checking

```bash
pnpm typecheck
```

---

## 🐳 Docker

### Using Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

### Build Individual Containers

```bash
# API
docker build -f apps/api/Dockerfile -t bloomium-api .

# Web
docker build -f apps/web/Dockerfile -t bloomium-web .

# Worker
docker build -f apps/worker/Dockerfile -t bloomium-worker .
```

---

## ☁️ Cloud Deployment (GCP)

### Prerequisites

- Google Cloud Project
- `gcloud` CLI installed and authenticated
- Cloud Run API enabled
- Cloud Storage bucket created

### Deploy Services

```bash
# Deploy API
gcloud run deploy bloomium-api \
  --source ./apps/api \
  --region us-central1 \
  --allow-unauthenticated

# Deploy Web
gcloud run deploy bloomium-web \
  --source ./apps/web \
  --region us-central1 \
  --allow-unauthenticated

# Deploy Worker as Cloud Run Job
gcloud run jobs create bloomium-worker \
  --source ./apps/worker \
  --region us-central1 \
  --set-env-vars MODE=cloud,GCS_BUCKET=bloomium-tiles
```

### Environment Configuration

Update `.env.local` for cloud mode:

```bash
MODE=cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCS_BUCKET=bloomium-tiles
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check |
| `POST` | `/aoi/resolve` | Create/resolve Area of Interest |
| `GET` | `/tiles/:layer/:z/:x/:y` | Get tile (bloom/anomaly) |
| `GET` | `/timeseries` | Pixel time series data |
| `GET` | `/explain` | Explanation for a location |

### Example API Calls

```bash
# Health check
curl http://localhost:3001/healthz

# Get timeseries for a location
curl "http://localhost:3001/timeseries?lat=38.4&lon=-121.25&aoi_id=demo-aoi-1"

# Get explanation
curl "http://localhost:3001/explain?lat=38.4&lon=-121.25&date=2025-09-01"
```

---

## 🗺️ Features

- **Interactive Map**: Leaflet-based visualization with tile overlays
- **Layer Toggle**: Switch between Bloom Probability and Anomaly views
- **Date Selection**: Navigate through weekly observation data
- **Pixel Inspector**: Click any location to view:
  - Time series charts
  - Statistical metrics (ARI, ΔARI, Z-score)
  - Natural language explanations
- **Responsive UI**: Modern, clean interface built with Tailwind CSS

---

## 🤝 Contributing & Future Work

1. Implement proper authentication
2. Add rate limiting and caching
3. Set up monitoring and alerting
4. Crowdsourced ground truth

---

## 📄 License

**Elastic License 2.0**

Bloomium is source-available software. You are free to:
- Study and learn from the code
- Use it internally or for research
- Modify and experiment with it

You may **not**:
- Offer Bloomium (or a substantially similar product) as a competing managed service
- Remove or obscure licensing notices

See [LICENSE](./LICENSE) for full terms.

**Why this license?** We want to share our bloom detection methodology and inspire the research community, while preventing direct commercial competition. If you want to use Bloomium commercially or build a competing service, please contact us for a commercial license.

---

## 🌸 About

Bloomium helps researchers, ecologists, and nature enthusiasts track flowering phenology patterns globally using satellite-derived indices (ARI, NDVI) from Sentinel-2 imagery.

Built with TypeScript, optimized for serverless deployment on Google Cloud Platform.

### NASA Space Apps Challenge 2025

This project was developed as part of the **NASA Space Apps Challenge 2025**, leveraging NASA's Earth observation data and Sentinel-2 satellite imagery to address global flowering phenology monitoring. By combining advanced remote sensing techniques with modern web technologies, Bloomium demonstrates how space-based data can be made accessible and actionable for environmental research and conservation efforts.

---

<div align="center">

**Happy Blooming! 🪷**

Made with 💚 for Earth observation and ecological research

</div>

