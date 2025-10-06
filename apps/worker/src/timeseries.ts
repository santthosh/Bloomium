import path from 'path';
import fs from 'fs-extra';
import { Storage } from '@google-cloud/storage';
import { Grid, BBox, TimeseriesPoint } from './types';
import { config } from './config';

const storage = new Storage();
const bucket = storage.bucket(config.gcs.bucket);

/**
 * Pick sample points within AOI for timeseries tracking
 * Returns 5 points: center + 4 corners (slightly inset)
 */
export function pickSamplePoints(bbox: BBox): Array<{ lat: number; lon: number }> {
  const [west, south, east, north] = bbox;
  const centerLon = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const inset = 0.1; // 10% inset from edges

  return [
    { lat: centerLat, lon: centerLon }, // Center
    { lat: south + (north - south) * inset, lon: west + (east - west) * inset }, // SW
    { lat: south + (north - south) * inset, lon: east - (east - west) * inset }, // SE
    { lat: north - (north - south) * inset, lon: west + (east - west) * inset }, // NW
    { lat: north - (north - south) * inset, lon: east - (east - west) * inset }, // NE
  ];
}

/**
 * Sample grid at specific points
 */
function sampleGridAtPoints(grid: Grid, points: Array<{ lat: number; lon: number }>): number[] {
  return points.map((pt) => {
    const x = Math.floor((pt.lon - grid.lon0) / grid.pxSize);
    const y = Math.floor((pt.lat - grid.lat0) / grid.pxSize);

    if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
      return grid.data[y * grid.width + x];
    }
    return NaN;
  });
}

/**
 * Update timeseries.json with new date and ARI values
 */
export async function updateTimeseries(
  aoiId: string,
  date: string,
  bbox: BBox,
  ariGrid: Grid,
  bloomGrid: Grid
): Promise<void> {
  const timeseriesPath = path.join(config.storagePath, aoiId, date, 'timeseries.json');
  await fs.ensureDir(path.dirname(timeseriesPath));

  // Pick sample points
  const points = pickSamplePoints(bbox);

  // Sample ARI and bloom score
  const ariValues = sampleGridAtPoints(ariGrid, points);
  const bloomValues = sampleGridAtPoints(bloomGrid, points);

  // Calculate averages (excluding NaN)
  const avgAri =
    ariValues.filter((v) => !isNaN(v)).reduce((sum, v) => sum + v, 0) /
    ariValues.filter((v) => !isNaN(v)).length;

  const avgBloom =
    bloomValues.filter((v) => !isNaN(v)).reduce((sum, v) => sum + v, 0) /
    bloomValues.filter((v) => !isNaN(v)).length;

  const timeseriesPoint: TimeseriesPoint = {
    date,
    ari: parseFloat((avgAri || 0).toFixed(4)),
    bloom_probability: parseFloat((avgBloom || 0).toFixed(4)),
  };

  // Try to load existing timeseries from other dates
  const parentDir = path.join(config.storagePath, aoiId);
  const allTimeseries: TimeseriesPoint[] = [];

  if (await fs.pathExists(parentDir)) {
    const dates = await fs.readdir(parentDir);

    for (const d of dates) {
      const tsPath = path.join(parentDir, d, 'timeseries.json');
      if (await fs.pathExists(tsPath)) {
        try {
          const existing = await fs.readJSON(tsPath);
          // Handle both array and single object formats
          if (Array.isArray(existing)) {
            allTimeseries.push(...existing);
          } else {
            allTimeseries.push(existing);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  // Add current point
  allTimeseries.push(timeseriesPoint);

  // Deduplicate by date and sort
  const uniqueDates = new Map<string, TimeseriesPoint>();
  for (const pt of allTimeseries) {
    uniqueDates.set(pt.date, pt);
  }

  const sorted = Array.from(uniqueDates.values()).sort((a, b) => a.date.localeCompare(b.date));

  await fs.writeJSON(timeseriesPath, sorted, { spaces: 2 });
  
  // Upload to GCS if in cloud mode
  if (config.mode === 'cloud') {
    const gcsPath = `${aoiId}/${date}/timeseries.json`;
    await bucket.file(gcsPath).save(JSON.stringify(sorted, null, 2), {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'public, max-age=300',
      },
    });
  }
  
  console.log(`      ✓ Updated timeseries.json (${sorted.length} points)`);
}

