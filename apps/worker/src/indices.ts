import { Grid, Baseline } from './types';
import { config } from './config';

/**
 * Compute ARI (Anthocyanin Reflectance Index)
 * ARI = (1/B03) - (1/B05)
 * Higher values indicate more anthocyanin (bloom pigments)
 */
export function computeARI(b03: Grid, b05: Grid, eps = config.processing.epsilon): Grid {
  if (b03.width !== b05.width || b03.height !== b05.height) {
    throw new Error('B03 and B05 grids must have same dimensions');
  }

  const ariData = new Float32Array(b03.data.length);

  for (let i = 0; i < ariData.length; i++) {
    const v03 = b03.data[i];
    const v05 = b05.data[i];

    // Skip if either band is NaN (masked)
    if (isNaN(v03) || isNaN(v05)) {
      ariData[i] = NaN;
      continue;
    }

    // ARI formula with epsilon to avoid division by zero
    ariData[i] = 1 / Math.max(v03, eps) - 1 / Math.max(v05, eps);
  }

  return {
    width: b03.width,
    height: b03.height,
    lon0: b03.lon0,
    lat0: b03.lat0,
    pxSize: b03.pxSize,
    data: ariData,
    epsg: b03.epsg,
  };
}

/**
 * Compute delta ARI from previous week
 * ΔARI = ARI_current - ARI_previous
 */
export function deltaWeek(curr: Grid, prev?: Grid): Grid {
  const deltaData = new Float32Array(curr.data.length);

  if (!prev) {
    // No previous data - return zeros
    deltaData.fill(0);
  } else {
    if (curr.width !== prev.width || curr.height !== prev.height) {
      console.warn('⚠️  Current and previous grids have different dimensions, filling with zeros');
      deltaData.fill(0);
    } else {
      for (let i = 0; i < deltaData.length; i++) {
        const c = curr.data[i];
        const p = prev.data[i];

        if (isNaN(c) || isNaN(p)) {
          deltaData[i] = NaN;
        } else {
          deltaData[i] = c - p;
        }
      }
    }
  }

  return {
    width: curr.width,
    height: curr.height,
    lon0: curr.lon0,
    lat0: curr.lat0,
    pxSize: curr.pxSize,
    data: deltaData,
    epsg: curr.epsg,
  };
}

/**
 * Compute Z-score (standard deviations from baseline)
 * Z = (X - mean) / std
 */
export function zScore(curr: Grid, base: Baseline, eps = 1e-6): Grid {
  if (curr.width !== base.mean.width || curr.height !== base.mean.height) {
    throw new Error('Current and baseline grids must have same dimensions');
  }

  const zData = new Float32Array(curr.data.length);

  for (let i = 0; i < zData.length; i++) {
    const x = curr.data[i];
    const mean = base.mean.data[i];
    const std = base.std.data[i];

    if (isNaN(x) || isNaN(mean) || isNaN(std)) {
      zData[i] = NaN;
    } else {
      zData[i] = (x - mean) / Math.max(std, eps);
    }
  }

  return {
    width: curr.width,
    height: curr.height,
    lon0: curr.lon0,
    lat0: curr.lat0,
    pxSize: curr.pxSize,
    data: zData,
    epsg: curr.epsg,
  };
}

/**
 * Compute bloom score from Z-score and delta
 * score = clip((0.6*tanh(Z) + 0.4*tanh(delta*5) + 1)/2, 0, 1)
 * This blends statistical anomaly with week-over-week change
 */
export function bloomScore(z: Grid, delta: Grid): Grid {
  if (z.width !== delta.width || z.height !== delta.height) {
    throw new Error('Z and delta grids must have same dimensions');
  }

  const scoreData = new Float32Array(z.data.length);

  for (let i = 0; i < scoreData.length; i++) {
    const zVal = z.data[i];
    const dVal = delta.data[i];

    if (isNaN(zVal) || isNaN(dVal)) {
      scoreData[i] = NaN;
    } else {
      // Blend Z-score and delta with tanh normalization
      const score = (0.6 * Math.tanh(zVal) + 0.4 * Math.tanh(dVal * 5) + 1) / 2;
      scoreData[i] = Math.max(0, Math.min(1, score));
    }
  }

  return {
    width: z.width,
    height: z.height,
    lon0: z.lon0,
    lat0: z.lat0,
    pxSize: z.pxSize,
    data: scoreData,
    epsg: z.epsg,
  };
}

/**
 * Create a simple rolling baseline from recent grids
 * MVP: just use mean/std across provided grids
 */
export function createRollingBaseline(grids: Grid[]): Baseline {
  if (grids.length === 0) {
    throw new Error('Cannot create baseline from empty grid list');
  }

  const first = grids[0];
  const n = first.data.length;
  const meanData = new Float32Array(n);
  const stdData = new Float32Array(n);

  // Calculate mean
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;

    for (const grid of grids) {
      const v = grid.data[i];
      if (!isNaN(v)) {
        sum += v;
        count++;
      }
    }

    meanData[i] = count > 0 ? sum / count : NaN;
  }

  // Calculate std
  for (let i = 0; i < n; i++) {
    let sumSq = 0;
    let count = 0;

    for (const grid of grids) {
      const v = grid.data[i];
      if (!isNaN(v)) {
        sumSq += Math.pow(v - meanData[i], 2);
        count++;
      }
    }

    stdData[i] = count > 1 ? Math.sqrt(sumSq / count) : 1.0; // Default std=1 if not enough data
  }

  return {
    mean: {
      width: first.width,
      height: first.height,
      lon0: first.lon0,
      lat0: first.lat0,
      pxSize: first.pxSize,
      data: meanData,
      epsg: first.epsg,
    },
    std: {
      width: first.width,
      height: first.height,
      lon0: first.lon0,
      lat0: first.lat0,
      pxSize: first.pxSize,
      data: stdData,
      epsg: first.epsg,
    },
  };
}

