# WORKER_BUILD.md — Bloomium Worker (Satellite → Tiles)

## 0) Purpose
Implement a **Node.js/TypeScript** worker that fetches **real Sentinel‑2 L2A** imagery via **STAC**, computes bloom‑sensitive indices (**ARI**, ΔARI, Z‑anomaly), applies cloud/snow masking (SCL), and writes **web map tiles (PNG)** plus lightweight metadata for the Bloomium app.

Target: usable on a laptop for small AOIs; portable to Cloud Run Jobs later.

---

## 1) Scope (MVP)
- Input: `{ aoi_id, bbox, dates[], start?, end? }` (JSON file or object)
- For each date:
  1. STAC query for Sentinel‑2 L2A in a ±3‑day window.
  2. Download (stream) required bands: **B03 (10m), B05 (20m), SCL (20m)**.
  3. Resample B05→10m, SCL→10m (nearest), clip to AOI.
  4. Mask clouds/snow/shadows using **SCL**.
  5. Compute **ARI** and **ΔARI_week**; compute **Z‑anomaly** vs baseline.
  6. Blend to **bloom score** in [0,1].
  7. Reproject to **EPSG:3857** per tile window and write **PNG tiles** for zoom **z=6..10**:
     - `tiles/bloom/{z}/{x}/{y}.png`
     - `tiles/anomaly/{z}/{x}/{y}.png` (diverging Z map)
  8. Write `meta.json` (cloud %, thresholds, baseline info) and `timeseries.json` (few points).

Out of scope (v1): Landsat fallback, iNat fusion, full COG outputs (optional), massive AOIs.

---

## 2) Directory & Files
```
apps/worker/
  src/
    cli.ts                 # yargs CLI entry
    job.ts                 # runJob orchestrator
    stac.ts                # STAC search + item helpers
    fetch.ts               # HTTP ranged reads; GeoTIFF helpers
    bands.ts               # read/align bands to common grid
    mask.ts                # SCL → valid mask
    indices.ts             # ARI, ΔARI, baseline, Z, score
    reproj.ts              # lon/lat ↔ EPSG:3857, window reprojection
    tiles.ts               # value→RGBA, PNG writer, pyramid loop
    color.ts               # palettes & value mapping
    meta.ts                # meta.json writer
    timeseries.ts          # sample points & timeseries.json
    types.ts               # shared TS interfaces
  fixtures/
    demo-aoi.json
  README.md
```

---

## 3) Dependencies
Use JS/TS‑native libs only:
- `geotiff` — read GeoTIFF via HTTP range
- `pngjs` or `sharp` — write PNG tiles (256×256)
- `proj4` — projections (WGS84↔EPSG:3857)
- `node-fetch`/`undici` — HTTP client
- `zod` — schema validation
- `fs-extra` — filesystem
- `yargs` — CLI
- `tinyqueue` *(optional)* — small priority queue if needed

Dev: `tsx`, `typescript`

---

## 4) Environment & Config
```
STORAGE_DIR=./local-data
STAC_ENDPOINT=https://earth-search.aws.element84.com/v1
TILE_Z_MIN=6
TILE_Z_MAX=10
MAX_SCENES_PER_WEEK=2
DOWNLOAD_CONCURRENCY=3
EPSILON=1e-4
```
All config is overridable via CLI flags.

---

## 5) Types (types.ts)
```ts
export type BBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface AOIInput {
  aoi_id: string;
  bbox: BBox;
  dates: string[];           // ISO "YYYY-MM-DD" (week centers)
  start?: string;
  end?: string;
}

export interface STACItem {
  id: string;
  properties: { datetime: string; 'eo:cloud_cover'?: number; };
  assets: Record<string, { href: string; type?: string }>;
  bbox: BBox;
}

export interface Grid {
  width: number;
  height: number;
  lon0: number; lat0: number; // origin
  pxSize: number;             // degrees per pixel (approx if WGS84 grid used pre‑3857)
  data: Float32Array;         // row-major
  nodata?: number;
}

export interface Mask extends Grid { data: Uint8Array; } // 1=valid, 0=masked

export interface Meta {
  date: string;
  cloud_pct: number;
  z_levels: number[];
  baseline: { type: 'same-week-median' | 'rolling'; years?: number[] };
  thresholds: { z_sig: number; delta_week: number };
  notes?: string;
}
```

---

## 6) STAC (stac.ts)
### 6.1 Search
```ts
export async function stacSearch(bbox: BBox, start: string, end: string): Promise<STACItem[]>;
```
- POST `${STAC_ENDPOINT}/search`
- `collections: ["sentinel-2-l2a"]`
- `bbox`, `datetime: "${start}/${end}"`
- `limit: 100`, `sortby: [{ field: "properties.eo:cloud_cover", direction: "asc" }]`

**Pick scenes:** keep first `MAX_SCENES_PER_WEEK` items.

### 6.2 Example request body
```json
{
  "collections": ["sentinel-2-l2a"],
  "bbox": [minLon, minLat, maxLon, maxLat],
  "datetime": "2025-08-29/2025-09-04",
  "limit": 100,
  "sortby": [{ "field": "properties.eo:cloud_cover", "direction": "asc" }]
}
```

---

## 7) Fetch & Bands (fetch.ts, bands.ts)
### 7.1 Fetch helpers
```ts
export async function openTiff(url: string): Promise<any>;        // geotiff.fromUrl
export async function readBandWindow(tiff: any, bandIndex: number, window?: number[]): Promise<Float32Array>;
```

### 7.2 Read bands
```ts
export interface BandSet {
  b03: Grid;   // 10m
  b05: Grid;   // 10m (resampled from 20m)
  scl: Mask;   // 10m nearest
}

export async function readBandSet(item: STACItem, bbox: BBox): Promise<BandSet>;
```
- Use `assets['B03']`, `assets['B05']`, `assets['SCL']` (keys can vary: account for lowercase variants).
- Clip to AOI: compute pixel window from geotransform; read window only.
- Resample **B05** to match B03 grid (bilinear). Resample **SCL** with nearest.

---

## 8) Masking (mask.ts)
### 8.1 SCL codes (Sentinel‑2 L2A)
- 0: No data, 1: Saturated/Defective, 2: Dark area, 3: Cloud shadows, 4: Vegetation,
- 5: Bare soils, 6: Water, 7: Clouds low prob., 8: Clouds med prob., 9: Clouds high prob.,
- 10: Thin cirrus, 11: Snow/Ice

### 8.2 Build mask
```ts
export function buildValidMask(scl: Grid): Mask;
```
- Valid = {4,5} (+ optionally 2)  
- Invalid = {0,1,3,6,7,8,9,10,11}
- Optionally dilate/erode to clean speckle (skip in MVP).

Apply mask by setting invalid pixels to `NaN` in float grids.

---

## 9) Indices & Stats (indices.ts)
### 9.1 ARI (Anthocyanin Reflectance Index)
```ts
export function computeARI(b03: Grid, b05: Grid, eps=1e-4): Grid;
```
`ARI = (1/max(B03, eps)) - (1/max(B05, eps))`

### 9.2 Delta week
```ts
export function deltaWeek(curr: Grid, prev?: Grid): Grid; // if prev missing, zeros
```

### 9.3 Baseline & Z
Simplified MVP baseline:
- Try to load previous same‑week means/std from disk (`baseline/{week}.json`).  
- If missing, use last 3–5 available weeks around the target date (rolling).

```ts
export interface Baseline { mean: Grid; std: Grid; }
export function zScore(curr: Grid, base: Baseline, eps=1e-6): Grid;
```

### 9.4 Bloom score (0..1)
```ts
export function bloomScore(z: Grid, d: Grid): Grid;
// score = clip((0.6*tanh(Z) + 0.4*tanh(d*5) + 1)/2, 0, 1)
```

---

## 10) Reprojection & Tiling (reproj.ts, tiles.ts)
### 10.1 Projection helpers (proj4)
```ts
export function lonLatTo3857(lon: number, lat: number): { x: number; y: number };
export function tileBoundsXYZ(z: number, x: number, y: number): { minX:number, minY:number, maxX:number, maxY:number }; // in EPSG:3857 meters
```

### 10.2 Window reprojection
- For each XYZ tile (z=6..10), compute its bounds in 3857, then sample source grid (in geographic) via inverse transform (nearest/bilinear).  
- Do **per‑tile** reprojection to avoid huge memory.

### 10.3 Color & PNG
```ts
export function rgbaFromScore(v: number): [r,g,b,a];          // for bloom
export function rgbaFromZ(z: number): [r,g,b,a];              // for anomaly
export async function writeTile(outPath: string, pixels: Uint8ClampedArray, w=256, h=256): Promise<void>;
export async function writePyramid(grid: Grid, aoi_id: string, date: string, layer: "bloom"|"anomaly"): Promise<void>;
```

- **Bloom**: single‑hue ramp (pink→green) with alpha scaled by score.
- **Anomaly**: diverging ramp (blue↔white↔red) with alpha by |Z|.

---

## 11) Metadata & Timeseries (meta.ts, timeseries.ts)
### 11.1 `meta.json`
```ts
export async function writeMeta(path: string, meta: Meta): Promise<void>;
```
Minimum fields: `date, cloud_pct, z_levels, baseline, thresholds`

### 11.2 `timeseries.json` (sparse)
```ts
export async function updateTimeseries(aoiId: string, date: string, samples: {lat:number;lon:number;}[], values: { ari:number[]; cired?:number[]; dates:string[] }): Promise<void>;
```
- MVP: pick 3–10 sample points (center + corners inside AOI) and record ARI over available dates.

---

## 12) Orchestrator (job.ts)
```ts
export interface RunJobInput extends AOIInput { force?: boolean; }
export async function runJob(input: RunJobInput): Promise<void>;
```
Steps per date:
1. `stacSearch` → best scenes
2. `readBandSet` → b03/b05/scl aligned to 10m, clipped
3. `buildValidMask` → apply
4. `computeARI` → `ariCurr`
5. Load `ariPrev` if exists → `deltaWeek`
6. Load baseline or estimate → `z = zScore(ariCurr, base)`
7. `score = bloomScore(z, delta)`
8. `writePyramid(score, aoi_id, date, "bloom")`
9. `writePyramid(z, aoi_id, date, "anomaly")`
10. `writeMeta(...)`, `updateTimeseries(...)`

Idempotency: skip if tiles exist and `!force`.

---

## 13) CLI (cli.ts)
```ts
import yargs from "yargs";

yargs(process.argv.slice(2))
  .option("aoi", { type: "string", demandOption: true, desc: "Path to AOI JSON" })
  .option("start", { type: "string" })
  .option("end", { type: "string" })
  .option("dates", { type: "string", desc: "Comma-separated YYYY-MM-DD list" })
  .option("force", { type: "boolean", default: false })
  .command("*", "Run job", async (args) => { /* parse AOI JSON, call runJob */ })
  .help().argv;
```

Example:
```
node dist/cli.js --aoi apps/worker/fixtures/demo-aoi.json --dates 2025-09-01,2025-09-08 --force
```

---

## 14) Error Handling & Retries
- STAC & HTTP: retry x3 with exponential backoff.
- If **no scenes**: emit transparent tiles, write meta `{ low_confidence: true }`.
- Partial read: try next best scene.
- Always write `meta.json` so UI can still render status.

---

## 15) Performance Notes
- Keep AOI ≤ ~5,000 km² for laptops. Larger → chunk AOI into tiles first.
- Stream read with `geotiff` (range requests).
- Avoid full‑AOI arrays in memory; operate per tile window.
- Limit parallel downloads (`DOWNLOAD_CONCURRENCY`).

---

## 16) Testing
### Unit
- `indices.computeARI` no NaNs; bounded by EPSILON.
- `mask.buildValidMask` filters SCL clouds/snow correctly.
- `tiles.rgbaFromZ` & `rgbaFromScore` mapping stable.

### Integration
- Tiny 1×1 tile AOI → verify pyramid count (z=6..10).
- Golden image check for a few tiles (PNG pixel diff < tolerance).
- `meta.json` schema validation with `zod`.

---

## 17) Acceptance Criteria
- ✅ For each requested date, worker writes:
  - `tiles/bloom/{z}/{x}/{y}.png`
  - `tiles/anomaly/{z}/{x}/{y}.png`
  - `meta.json` (with `cloud_pct`, `z_levels`, `baseline`, `thresholds`)
  - `timeseries.json` with at least 3 points over available dates
- ✅ Web app overlays tiles instantly; `/explain` can read Z and Δ from meta or grids.
- ✅ Re‑running with same inputs is idempotent (unless `--force`).

---

## 18) Implementation Checklist (Cursor tasks)
1. **types.ts** — add all interfaces (AOIInput, STACItem, Grid, Mask, Meta).
2. **stac.ts** — POST search, select best scenes, return items.
3. **fetch.ts** — `openTiff`, `readBandWindow` helpers.
4. **bands.ts** — assemble `BandSet` (B03, B05→10m, SCL→10m), AOI clip windows.
5. **mask.ts** — SCL→valid mask, apply to grids.
6. **indices.ts** — ARI, deltaWeek, baseline (disk rolling), zScore, bloomScore.
7. **reproj.ts** — lon/lat↔3857, tileBoundsXYZ, sampler (nearest/bilinear).
8. **color.ts** — palettes & value→RGBA (bloom & anomaly).
9. **tiles.ts** — writeTile, writePyramid (iterate z/x/y within AOI extent).
10. **meta.ts** — `writeMeta` schema & writer.
11. **timeseries.ts** — pick sample points; update JSON over dates.
12. **job.ts** — `runJob` orchestrator with idempotency & logging.
13. **cli.ts** — yargs entry; wire envs & flags.
14. Add **unit tests** for indices/mask/color; **integration** small AOI.
15. Wire to **apps/api**: ensure `/tiles/...` reads files at `STORAGE_DIR`.

---

## 19) Notes & References
- Sentinel‑2 L2A SCL classes per ESA docs.
- STAC Earth Search v1 by Element84 (AWS Sentinel‑2 public data).
- Projection: EPSG:3857 math (standard Web Mercator).

---

## 20) Future (post‑MVP)
- Landsat fallback & MODIS baseline for history.
- Confidence layer & iNaturalist fusion.
- Cloud Run Job + Pub/Sub integration.
- COG writes and rio‑tiler compatible endpoints.

---

## 21) Access & Authentication for Data Sources (REQUIRED READING)

### 21.1 Primary Source: Earth Search (Element 84 STAC) — **No API key required**
- **Endpoint:** `https://earth-search.aws.element84.com/v1`  
- **Auth:** **None** for standard search and access to public assets. Earth Search is described as a **free-to-use STAC API** for public datasets on AWS. citeturn0search9  
- **Docs:** STAC API docs at `/v1/api.html`. citeturn0search1  
- **Dataset:** Sentinel‑2 L2A COGs are part of the **AWS Registry of Open Data** with *free, full and open* access. citeturn0search2turn0search17

**Worker requirement:** Default to Earth Search. Do NOT require credentials. Implement polite client behavior (User‑Agent header, modest pagination, backoff).

### 21.2 Alternative Source: Copernicus Data Space Ecosystem (CDSE) — **Tokens required**
- Some CDSE APIs (OData/OpenSearch/Process API) require an **access token** and account setup. citeturn0search7turn0search15turn0search11  
- Use only if Earth Search is down or if specific assets are missing. Gate behind config flags (see 21.4).

### 21.3 Third‑Party Processing APIs (e.g., Sentinel Hub) — **OAuth2 tokens required**
- Sentinel Hub APIs require **OAuth2** and registered client credentials. Not needed for MVP. citeturn0search3

### 21.4 Worker config flags (to switch sources / add tokens)
Add these env vars (optional) and honor them in `stac.ts`:
```
DATA_SOURCE=earth-search             # earth-search | cdse | sentinel-hub
EARTH_SEARCH_ENDPOINT=https://earth-search.aws.element84.com/v1
CDSE_BASE=https://dataspace.copernicus.eu
CDSE_TOKEN=                           # if DATA_SOURCE=cdse
SENTINEL_HUB_BASE=https://services.sentinel-hub.com
SENTINEL_HUB_OAUTH_CLIENT_ID=
SENTINEL_HUB_OAUTH_CLIENT_SECRET=
```

### 21.5 Rate‑limits & polite usage
- Expect public STAC to throttle heavy traffic. Implement **retry with exponential backoff** and **cap parallel downloads** (`DOWNLOAD_CONCURRENCY`).  
- Cache search results to disk per `{aoi_id,date}` to avoid repeated identical queries.  
- On repeated **429/5xx** from Earth Search, switch to slow‑path retries; only then optionally failover to CDSE (if token configured).

### 21.6 Legal & cost notes
- **AWS Registry of Open Data (Sentinel‑2)**: access is **free and open**; assets are public HTTP(S). citeturn0search2  
- Some historic threads note open access without auth for Sentinel‑2 on AWS. citeturn0search14  
- CDSE & Sentinel Hub may have **usage limits** and **terms**; if used, document the account/keys outside the repo (no secrets in git).

### 21.7 Acceptance criteria (access)
- ✅ Worker runs end‑to‑end against **Earth Search** with **no API keys**.  
- ✅ Returns clear error message if optional sources (CDSE/Sentinel Hub) are selected but tokens are missing.  
- ✅ Backoff logic prevents hammering public endpoints.
