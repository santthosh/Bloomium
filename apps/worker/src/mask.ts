import { Grid, Mask } from './types';

/**
 * Sentinel-2 L2A Scene Classification (SCL) codes:
 * 0: No data
 * 1: Saturated/Defective
 * 2: Dark area / Shadows
 * 3: Cloud shadows
 * 4: Vegetation
 * 5: Bare soils
 * 6: Water
 * 7: Clouds low probability
 * 8: Clouds medium probability
 * 9: Clouds high probability
 * 10: Thin cirrus
 * 11: Snow/Ice
 */

const VALID_SCL_CODES = new Set([4, 5]); // Vegetation, Bare soils

/**
 * Build valid mask from SCL (Scene Classification Layer)
 * Returns 1 for valid pixels, 0 for masked
 */
export function buildValidMask(scl: Mask): Mask {
  const validData = new Uint8Array(scl.data.length);

  for (let i = 0; i < scl.data.length; i++) {
    const code = scl.data[i];
    validData[i] = VALID_SCL_CODES.has(code) ? 1 : 0;
  }

  return {
    ...scl,
    data: validData,
  };
}

/**
 * Apply mask to a grid (set invalid pixels to NaN)
 */
export function applyMask(grid: Grid, mask: Mask): Grid {
  if (grid.width !== mask.width || grid.height !== mask.height) {
    throw new Error(
      `Grid and mask dimensions mismatch: ${grid.width}×${grid.height} vs ${mask.width}×${mask.height}`
    );
  }

  const maskedData = new Float32Array(grid.data);

  for (let i = 0; i < maskedData.length; i++) {
    if (mask.data[i] === 0) {
      maskedData[i] = NaN;
    }
  }

  return {
    ...grid,
    data: maskedData,
  };
}

/**
 * Calculate cloud percentage from SCL
 */
export function calculateCloudPct(scl: Mask): number {
  let cloudPixels = 0;
  let totalPixels = 0;

  for (let i = 0; i < scl.data.length; i++) {
    const code = scl.data[i];
    if (code !== 0) {
      // Exclude no-data
      totalPixels++;
      if ([7, 8, 9, 10].includes(code)) {
        // Cloud codes
        cloudPixels++;
      }
    }
  }

  return totalPixels > 0 ? (cloudPixels / totalPixels) * 100 : 100;
}

