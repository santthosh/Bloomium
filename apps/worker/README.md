# Bloomium Worker - Real Satellite Data Pipeline

Processes Sentinel-2 L2A imagery to generate bloom detection tiles.

## Quick Start

```bash
# Install dependencies (from project root)
pnpm install

# Run worker with example AOI
cd apps/worker
pnpm dev -- --aoi fixtures/california-central-valley.json

# Or process specific dates
pnpm dev -- --aoi fixtures/california-central-valley.json --dates 2025-09-01,2025-09-08

# Force reprocessing
pnpm dev -- --aoi fixtures/california-central-valley.json --force
```

## Pipeline Overview

1. **STAC Search** → Query Earth Search for Sentinel-2 scenes
2. **Band Reading** → Download B03 (green), B05 (red-edge), SCL (cloud mask)
3. **Cloud Masking** → Filter clouds/snow using Scene Classification Layer
4. **ARI Computation** → Calculate Anthocyanin Reflectance Index
5. **Anomaly Detection** → Compute Z-scores and week-over-week deltas
6. **Bloom Scoring** → Blend statistical anomaly with change detection
7. **Tile Generation** → Reproject to Web Mercator and write PNG tiles
8. **Metadata** → Generate meta.json and timeseries.json

## Data Source

- **Primary**: Earth Search (Element 84) - **No API key required**
- **Endpoint**: https://earth-search.aws.element84.com/v1
- **Dataset**: Sentinel-2 L2A Cloud-Optimized GeoTIFFs on AWS

## Environment Variables

```bash
STORAGE_PATH=./local-data          # Where to write tiles
STAC_ENDPOINT=https://earth-search.aws.element84.com/v1
TILE_Z_MIN=6                        # Minimum zoom level
TILE_Z_MAX=10                       # Maximum zoom level
MAX_SCENES_PER_WEEK=2               # Max scenes to composite
DOWNLOAD_CONCURRENCY=3              # Parallel downloads
```

## AOI File Format

```json
{
  "aoi_id": "my-region",
  "name": "My Region Name",
  "bbox": [minLon, minLat, maxLon, maxLat],
  "dates": ["2025-09-01", "2025-09-08", "2025-09-15"]
}
```

## Output Structure

```
local-data/
  {aoi_id}/
    {date}/
      tiles/
        bloom/
          {z}/{x}/{y}.png
        anomaly/
          {z}/{x}/{y}.png
      meta.json
      timeseries.json
```

## Scientific Method

- **ARI** = (1/B03) - (1/B05) — Higher values indicate bloom pigments
- **ΔARI** = Week-over-week change
- **Z-score** = (ARI - baseline_mean) / baseline_std
- **Bloom Score** = 0.6×tanh(Z) + 0.4×tanh(5×ΔARI)

## Notes

- Designed for small-medium AOIs (~1000-5000 km²) on laptops
- Automatically retries on HTTP errors
- Writes transparent tiles when no scenes available
- Idempotent - skips existing tiles unless `--force`

