/**
 * Color mapping for bloom and anomaly layers
 */

/**
 * Map bloom score [0,1] to RGBA
 * Pink (low) -> Green (medium) -> Yellow (high)
 * Alpha increases with score
 */
export function rgbaFromScore(score: number): [number, number, number, number] {
  if (isNaN(score)) {
    return [0, 0, 0, 0]; // Transparent for NaN
  }

  // Clamp to [0, 1]
  const s = Math.max(0, Math.min(1, score));

  let r: number, g: number, b: number, a: number;

  if (s < 0.5) {
    // Pink to green
    const t = s * 2; // 0 to 1
    r = Math.floor(255 * (1 - t) + 50 * t);
    g = Math.floor(150 * (1 - t) + 255 * t);
    b = Math.floor(200 * (1 - t) + 50 * t);
  } else {
    // Green to yellow
    const t = (s - 0.5) * 2; // 0 to 1
    r = Math.floor(50 * (1 - t) + 255 * t);
    g = 255;
    b = Math.floor(50 * (1 - t) + 200 * t);
  }

  // Alpha scales with score (min 50, max 220)
  a = Math.floor(50 + s * 170);

  return [r, g, b, a];
}

/**
 * Map Z-score to RGBA (diverging color map)
 * Blue (negative) <- White (zero) -> Red (positive)
 * Alpha increases with |Z|
 */
export function rgbaFromZ(z: number): [number, number, number, number] {
  if (isNaN(z)) {
    return [0, 0, 0, 0]; // Transparent for NaN
  }

  // Clamp Z to reasonable range [-3, +3]
  const zClamped = Math.max(-3, Math.min(3, z));
  const normalized = (zClamped + 3) / 6; // Map to [0, 1]

  let r: number, g: number, b: number, a: number;

  if (normalized < 0.5) {
    // Blue to white
    const t = normalized * 2; // 0 to 1
    r = Math.floor(0 * (1 - t) + 255 * t);
    g = Math.floor(100 * (1 - t) + 255 * t);
    b = Math.floor(255 * (1 - t) + 255 * t);
  } else {
    // White to red
    const t = (normalized - 0.5) * 2; // 0 to 1
    r = 255;
    g = Math.floor(255 * (1 - t) + 50 * t);
    b = Math.floor(255 * (1 - t) + 0 * t);
  }

  // Alpha based on |Z| significance
  const absZ = Math.abs(zClamped);
  a = Math.floor(100 + Math.min(absZ / 3, 1) * 120); // 100 to 220

  return [r, g, b, a];
}

