import sharp from 'sharp';
import { TileCoord } from './types';

/**
 * Generates demo gradient tiles for bloom and anomaly layers
 * In production, this would compute ARI and ΔARI from Sentinel-2 imagery
 */
export class TileGenerator {
  private readonly TILE_SIZE = 256;

  /**
   * Generate a bloom probability tile (gradient from blue to red)
   */
  async generateBloomTile(coord: TileCoord, date: string): Promise<Buffer> {
    const { x, y, z } = coord;
    
    // Create gradient based on tile coordinates and date
    const dateOffset = new Date(date).getTime() / 1000000000;
    const seed = x + y * 100 + z * 10000 + dateOffset;
    
    const width = this.TILE_SIZE;
    const height = this.TILE_SIZE;
    const pixels = Buffer.alloc(width * height * 4);

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4;
        
        // Create a gradient effect
        const normalizedX = px / width;
        const normalizedY = py / height;
        const value = (normalizedX + normalizedY) / 2;
        
        // Add some pseudo-random variation
        const noise = Math.sin(seed + px * 0.1) * Math.cos(seed + py * 0.1);
        const bloom = Math.max(0, Math.min(1, value + noise * 0.2));
        
        // Color map: blue (no bloom) -> yellow -> red (high bloom)
        if (bloom < 0.5) {
          pixels[i] = Math.floor(bloom * 2 * 255); // R
          pixels[i + 1] = Math.floor(bloom * 2 * 200); // G
          pixels[i + 2] = 255 - Math.floor(bloom * 2 * 255); // B
        } else {
          pixels[i] = 255; // R
          pixels[i + 1] = Math.floor((1 - bloom) * 2 * 200); // G
          pixels[i + 2] = 0; // B
        }
        pixels[i + 3] = 200; // Alpha
      }
    }

    return await sharp(pixels, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  }

  /**
   * Generate an anomaly tile (z-score visualization)
   */
  async generateAnomalyTile(coord: TileCoord, date: string): Promise<Buffer> {
    const { x, y, z } = coord;
    
    const dateOffset = new Date(date).getTime() / 1000000000;
    const seed = x * 2 + y * 200 + z * 20000 + dateOffset;
    
    const width = this.TILE_SIZE;
    const height = this.TILE_SIZE;
    const pixels = Buffer.alloc(width * height * 4);

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4;
        
        // Generate z-score like pattern
        const noise1 = Math.sin(seed + px * 0.05) * Math.cos(seed + py * 0.05);
        const noise2 = Math.sin(seed * 2 + px * 0.1) * Math.cos(seed * 2 + py * 0.1);
        const zscore = (noise1 + noise2) * 2; // Range roughly -2 to +2
        
        // Color map: purple (negative) -> white (0) -> orange (positive)
        const normalized = (zscore + 2) / 4; // Normalize to 0-1
        
        if (normalized < 0.5) {
          // Purple to white
          const t = normalized * 2;
          pixels[i] = Math.floor(128 + t * 127); // R
          pixels[i + 1] = Math.floor(t * 255); // G
          pixels[i + 2] = Math.floor(255 - t * 127); // B
        } else {
          // White to orange
          const t = (normalized - 0.5) * 2;
          pixels[i] = 255; // R
          pixels[i + 1] = Math.floor(255 - t * 100); // G
          pixels[i + 2] = Math.floor(255 - t * 255); // B
        }
        pixels[i + 3] = Math.abs(zscore) > 0.5 ? 200 : 100; // Alpha based on significance
      }
    }

    return await sharp(pixels, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  }

  /**
   * Calculate tile coordinates for a bbox at given zoom level
   */
  getTilesForBBox(
    bbox: [number, number, number, number],
    zoom: number
  ): TileCoord[] {
    const [west, south, east, north] = bbox;
    
    // Convert bbox to tile coordinates
    const minTile = this.latLonToTile(north, west, zoom);
    const maxTile = this.latLonToTile(south, east, zoom);
    
    const tiles: TileCoord[] = [];
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        tiles.push({ z: zoom, x, y });
      }
    }
    
    return tiles;
  }

  /**
   * Convert lat/lon to tile coordinates
   */
  private latLonToTile(lat: number, lon: number, zoom: number): TileCoord {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
    );
    return { z: zoom, x, y };
  }
}

