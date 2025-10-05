import { Storage } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import { config, isLocalMode } from '../config';

class StorageService {
  private storage: Storage | null = null;

  constructor() {
    if (!isLocalMode()) {
      this.storage = new Storage({
        projectId: config.gcs.projectId,
      });
    }
  }

  /**
   * Get tile file path or GCS path
   */
  getTilePath(aoi_id: string, date: string, layer: 'bloom' | 'anomaly', z: number, x: number, y: number): string {
    return `${aoi_id}/${date}/tiles/${layer}/${z}/${x}/${y}.png`;
  }

  /**
   * Read tile file
   */
  async readTile(aoi_id: string, date: string, layer: 'bloom' | 'anomaly', z: number, x: number, y: number): Promise<Buffer> {
    const tilePath = this.getTilePath(aoi_id, date, layer, z, x, y);

    if (isLocalMode()) {
      const fullPath = path.join(process.cwd(), config.storagePath, tilePath);
      return await fs.readFile(fullPath);
    } else {
      // GCS mode
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(tilePath);
      const [buffer] = await file.download();
      return buffer;
    }
  }

  /**
   * Read metadata for an AOI/date
   */
  async readMeta(aoi_id: string, date: string): Promise<any> {
    const metaPath = `${aoi_id}/${date}/meta.json`;

    if (isLocalMode()) {
      const fullPath = path.join(process.cwd(), config.storagePath, metaPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(metaPath);
      const [buffer] = await file.download();
      return JSON.parse(buffer.toString('utf-8'));
    }
  }

  /**
   * Read timeseries data
   */
  async readTimeseries(aoi_id: string, date: string): Promise<any> {
    const timeseriesPath = `${aoi_id}/${date}/timeseries.json`;

    if (isLocalMode()) {
      const fullPath = path.join(process.cwd(), config.storagePath, timeseriesPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(timeseriesPath);
      const [buffer] = await file.download();
      return JSON.parse(buffer.toString('utf-8'));
    }
  }

  /**
   * Check if tile exists
   */
  async tileExists(aoi_id: string, date: string, layer: 'bloom' | 'anomaly', z: number, x: number, y: number): Promise<boolean> {
    const tilePath = this.getTilePath(aoi_id, date, layer, z, x, y);

    if (isLocalMode()) {
      const fullPath = path.join(process.cwd(), config.storagePath, tilePath);
      try {
        await fs.access(fullPath);
        return true;
      } catch {
        return false;
      }
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(tilePath);
      const [exists] = await file.exists();
      return exists;
    }
  }

  /**
   * Discover available dates for an AOI by listing storage directories
   */
  async discoverDates(aoi_id: string): Promise<string[]> {
    if (isLocalMode()) {
      const aoiPath = path.join(process.cwd(), config.storagePath, aoi_id);
      try {
        const entries = await fs.readdir(aoiPath, { withFileTypes: true });
        return entries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name)
          .sort();
      } catch {
        return [];
      }
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      // List all meta.json files for this AOI
      const [files] = await bucket.getFiles({
        prefix: `${aoi_id}/`,
        matchGlob: '**/meta.json',
      });
      
      // Extract dates from paths like: demo-aoi-1/2025-08-01/meta.json
      const dates = new Set<string>();
      files.forEach(file => {
        const parts = file.name.split('/');
        if (parts.length === 3 && parts[1]) {
          dates.add(parts[1]);
        }
      });
      
      return Array.from(dates).sort();
    }
  }
}

export const storageService = new StorageService();

