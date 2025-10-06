import { RunJobInput, Grid, Meta } from './types';
import { config } from './config';
import { stacSearch } from './stac';
import { readBandSet } from './bands';
import { buildValidMask, applyMask, calculateCloudPct } from './mask';
import { computeARI, deltaWeek, zScore, bloomScore, createRollingBaseline } from './indices';
import { writePyramid } from './tiles';
import { writeMeta, readMeta } from './meta';
import { updateTimeseries } from './timeseries';

/**
 * Main job orchestrator - processes one AOI across all dates
 */
export async function runJob(input: RunJobInput): Promise<void> {
  console.log(`\n🪷 Starting job for AOI: ${input.aoi_id}`);
  console.log(`   Bbox: [${input.bbox.join(', ')}]`);
  console.log(`   Dates: ${input.dates.length}`);
  console.log(`   Force: ${input.force || false}\n`);

  // Storage for ARI grids (for delta calculation and baseline)
  const ariHistory: Map<string, Grid> = new Map();

  for (let i = 0; i < input.dates.length; i++) {
    const date = input.dates[i];
    await processDate(input, date, i, ariHistory);
  }

  console.log(`\n✅ Job completed for ${input.aoi_id}`);
}

/**
 * Process a single date
 */
async function processDate(
  input: RunJobInput,
  date: string,
  dateIndex: number,
  ariHistory: Map<string, Grid>
): Promise<void> {
  console.log(`\n📅 Processing ${date} (${dateIndex + 1}/${input.dates.length})`);

  // Check if already processed
  if (!input.force) {
    const existing = await readMeta(input.aoi_id, date);
    if (existing) {
      console.log(`   ⏭️  Already processed, skipping (use --force to reprocess)`);
      return;
    }
  }

  // Step 1: STAC search (±3 days window)
  const startDate = getDateOffset(date, -3);
  const endDate = getDateOffset(date, 3);

  const scenes = await stacSearch(input.bbox, startDate, endDate);

  if (scenes.length === 0) {
    console.log(`   ⚠️  No scenes found, writing transparent tiles`);
    await writeEmptyTiles(input.aoi_id, date, input.bbox);
    return;
  }

  // Step 2: Read bands (use first available scene)
  const scene = scenes[0];
  console.log(`   🛰️  Using scene: ${scene.id}`);

  let bandSet;
  try {
    bandSet = await readBandSet(scene, input.bbox);
  } catch (error) {
    console.error(`   ❌ Failed to read bands: ${error}`);
    await writeEmptyTiles(input.aoi_id, date, input.bbox);
    return;
  }

  // Step 3: Build and apply mask
  console.log(`   🎭 Building cloud mask...`);
  const validMask = buildValidMask(bandSet.scl);
  const cloudPct = calculateCloudPct(bandSet.scl);
  console.log(`      Cloud coverage: ${cloudPct.toFixed(1)}%`);

  const b03Masked = applyMask(bandSet.b03, validMask);
  const b05Masked = applyMask(bandSet.b05, validMask);

  // Step 4: Compute ARI
  console.log(`   🧮 Computing ARI...`);
  const ariCurrent = computeARI(b03Masked, b05Masked);

  // Store for future use
  ariHistory.set(date, ariCurrent);

  // Step 5: Compute delta (week-over-week change)
  console.log(`   📊 Computing delta ARI...`);
  const prevDate = dateIndex > 0 ? input.dates[dateIndex - 1] : null;
  const ariPrev = prevDate ? ariHistory.get(prevDate) : undefined;
  const delta = deltaWeek(ariCurrent, ariPrev);

  // Step 6: Baseline & Z-score
  console.log(`   📈 Computing Z-score...`);
  const baseline = createRollingBaseline(
    Array.from(ariHistory.values()).slice(-5) // Use last 5 weeks max
  );
  const z = zScore(ariCurrent, baseline);

  // Step 7: Bloom score
  console.log(`   🌸 Computing bloom score...`);
  const bloom = bloomScore(z, delta);

  // Step 8: Write tiles
  await writePyramid(bloom, input.aoi_id, date, 'bloom', input.bbox);
  await writePyramid(z, input.aoi_id, date, 'anomaly', input.bbox);

  // Step 9: Write metadata
  const meta: Meta = {
    date,
    cloud_pct: parseFloat(cloudPct.toFixed(2)),
    z_levels: Array.from({ length: config.tiles.zMax - config.tiles.zMin + 1 }, (_, i) => config.tiles.zMin + i),
    baseline: {
      type: 'rolling',
      years: [], // Could track years if we had multi-year data
    },
    thresholds: {
      z_sig: 2.0,
      delta_week: 0.05,
    },
    notes: `Scene: ${scene.id}, Cloud: ${cloudPct.toFixed(1)}%`,
  };

  await writeMeta(input.aoi_id, date, meta);

  // Step 10: Update timeseries
  await updateTimeseries(input.aoi_id, date, input.bbox, ariCurrent, bloom);

  console.log(`   ✅ Completed ${date}`);
}

/**
 * Write empty/transparent tiles when no data available
 */
async function writeEmptyTiles(aoiId: string, date: string, bbox: [number, number, number, number]): Promise<void> {
  // Create empty grids
  const emptyGrid: Grid = {
    width: 1,
    height: 1,
    lon0: bbox[0],
    lat0: bbox[1],
    pxSize: 0.01,
    data: new Float32Array([NaN]),
  };

  await writePyramid(emptyGrid, aoiId, date, 'bloom', bbox);
  await writePyramid(emptyGrid, aoiId, date, 'anomaly', bbox);

  const meta: Meta = {
    date,
    cloud_pct: 100,
    z_levels: [],
    baseline: { type: 'rolling' },
    thresholds: { z_sig: 2.0, delta_week: 0.05 },
    notes: 'No scenes available',
  };

  await writeMeta(aoiId, date, meta);
}

/**
 * Get date with offset in days
 */
function getDateOffset(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

