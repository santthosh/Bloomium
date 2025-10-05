import { Storage } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import { config, isLocalMode } from './config';

export class StorageWriter {
  private storage: Storage | null = null;

  constructor() {
    if (!isLocalMode()) {
      this.storage = new Storage({
        projectId: config.gcs.projectId,
      });
    }
  }

  /**
   * Write tile to storage
   */
  async writeTile(
    aoi_id: string,
    date: string,
    layer: 'bloom' | 'anomaly',
    z: number,
    x: number,
    y: number,
    buffer: Buffer
  ): Promise<void> {
    const tilePath = `${aoi_id}/${date}/tiles/${layer}/${z}/${x}/${y}.png`;

    if (isLocalMode()) {
      const fullPath = path.join(config.storagePath, tilePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(tilePath);
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=86400',
        },
      });
    }
  }

  /**
   * Write JSON metadata
   */
  async writeJSON(aoi_id: string, date: string, filename: string, data: any): Promise<void> {
    const jsonPath = `${aoi_id}/${date}/${filename}`;

    if (isLocalMode()) {
      const fullPath = path.join(config.storagePath, jsonPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
    } else {
      const bucket = this.storage!.bucket(config.gcs.bucket);
      const file = bucket.file(jsonPath);
      await file.save(JSON.stringify(data, null, 2), {
        metadata: {
          contentType: 'application/json',
        },
      });
    }
  }
}

