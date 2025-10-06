import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import proj4 from 'proj4';
import { Storage } from '@google-cloud/storage';
import { Grid, TileCoord, BBox } from './types';
import { config } from './config';
import { tileBoundsXYZ, mercatorToLonLat, getTilesForBBox } from './reproj';
import { rgbaFromScore, rgbaFromZ } from './color';

// Initialize GCS client
const storage = new Storage();
const bucket = storage.bucket(config.gcs.bucket);

/**
 * Write a single PNG tile (local and/or GCS)
 */
export async function writeTile(
  pixels: Uint8ClampedArray,
  outPath: string,
  width = config.tiles.size,
  height = config.tiles.size
): Promise<void> {
  // Write locally first
  await fs.ensureDir(path.dirname(outPath));

  const pngBuffer = await sharp(Buffer.from(pixels.buffer), {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  await fs.writeFile(outPath, pngBuffer);

  // If cloud mode, also upload to GCS
  if (config.mode === 'cloud') {
    // Convert local path to GCS path (remove leading project root)
    const relativePath = outPath.replace(config.storagePath + '/', '');
    const gcsPath = relativePath;
    
    await bucket.file(gcsPath).save(pngBuffer, {
      contentType: 'image/png',
      metadata: {
        cacheControl: 'public, max-age=3600',
      },
    });
  }
}

/**
 * Sample a grid value at given lon/lat using bilinear interpolation
 */
function sampleGrid(grid: Grid, lon: number, lat: number): number {
  // Transform lon/lat to grid CRS if needed
  let gridX: number, gridY: number;
  
  if (grid.epsg && grid.epsg !== 4326) {
    try {
      [gridX, gridY] = proj4('EPSG:4326', `EPSG:${grid.epsg}`, [lon, lat]);
    } catch (error) {
      return NaN;
    }
  } else {
    gridX = lon;
    gridY = lat;
  }
  
  // Convert grid coordinates to pixel coordinates
  const x = (gridX - grid.lon0) / grid.pxSize;
  // Y: grid.lat0 is at the TOP (first row), flip the calculation
  const y = (grid.lat0 - gridY) / grid.pxSize;

  // Check bounds
  if (x < 0 || x >= grid.width - 1 || y < 0 || y >= grid.height - 1) {
    return NaN;
  }

  // Bilinear interpolation
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, grid.width - 1);
  const y1 = Math.min(y0 + 1, grid.height - 1);

  const fx = x - x0;
  const fy = y - y0;

  const v00 = grid.data[y0 * grid.width + x0];
  const v10 = grid.data[y0 * grid.width + x1];
  const v01 = grid.data[y1 * grid.width + x0];
  const v11 = grid.data[y1 * grid.width + x1];

  // If any value is NaN, return NaN
  if (isNaN(v00) || isNaN(v10) || isNaN(v01) || isNaN(v11)) {
    return NaN;
  }

  const top = v00 * (1 - fx) + v10 * fx;
  const bottom = v01 * (1 - fx) + v11 * fx;

  return top * (1 - fy) + bottom * fy;
}

/**
 * Render a single tile from a grid
 */
function renderTile(
  grid: Grid,
  coord: TileCoord,
  aoiBbox: BBox,
  colorMapper: (value: number) => [number, number, number, number]
): Uint8ClampedArray {
  const size = config.tiles.size;
  const pixels = new Uint8ClampedArray(size * size * 4);

  // Get tile bounds in Web Mercator
  const bounds = tileBoundsXYZ(coord.z, coord.x, coord.y);
  const [west, south, east, north] = aoiBbox;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = (py * size + px) * 4;

      // Convert pixel to Web Mercator coords
      const mercX = bounds.minX + (px / size) * (bounds.maxX - bounds.minX);
      const mercY = bounds.maxY - (py / size) * (bounds.maxY - bounds.minY);

      // Convert to lon/lat
      const { lon, lat } = mercatorToLonLat(mercX, mercY);

      // Check if within AOI bbox
      if (lon < west || lon > east || lat < south || lat > north) {
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 0; // Transparent
        continue;
      }

      // Sample grid value
      const value = sampleGrid(grid, lon, lat);

      // Map to color
      const [r, g, b, a] = colorMapper(value);
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    }
  }

  return pixels;
}

/**
 * Write full pyramid of tiles for a grid
 */
export async function writePyramid(
  grid: Grid,
  aoiId: string,
  date: string,
  layer: 'bloom' | 'anomaly',
  aoiBbox: BBox
): Promise<number> {
  console.log(`   🗺️  Writing ${layer} tiles...`);

  const colorMapper = layer === 'bloom' ? rgbaFromScore : rgbaFromZ;
  const baseDir = config.storagePath;

  let tileCount = 0;

  for (let z = config.tiles.zMin; z <= config.tiles.zMax; z++) {
    const tiles = getTilesForBBox(aoiBbox, z);

    for (const coord of tiles) {
      const pixels = renderTile(grid, coord, aoiBbox, colorMapper);

      const tilePath = path.join(
        baseDir,
        aoiId,
        date,
        'tiles',
        layer,
        `${z}`,
        `${coord.x}`,
        `${coord.y}.png`
      );

      await writeTile(pixels, tilePath);
      tileCount++;
    }
  }

  console.log(`      ✓ Wrote ${tileCount} ${layer} tiles (z=${config.tiles.zMin}..${config.tiles.zMax})`);
  return tileCount;
}

