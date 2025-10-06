import path from 'path';
import fs from 'fs-extra';
import { Meta } from './types';
import { config } from './config';

/**
 * Write meta.json for a date
 */
export async function writeMeta(aoiId: string, date: string, meta: Meta): Promise<void> {
  const metaPath = path.join(config.storagePath, aoiId, date, 'meta.json');
  await fs.ensureDir(path.dirname(metaPath));
  await fs.writeJSON(metaPath, meta, { spaces: 2 });
  console.log(`      ✓ Wrote meta.json`);
}

/**
 * Read meta.json if exists
 */
export async function readMeta(aoiId: string, date: string): Promise<Meta | null> {
  const metaPath = path.join(config.storagePath, aoiId, date, 'meta.json');
  if (await fs.pathExists(metaPath)) {
    return await fs.readJSON(metaPath);
  }
  return null;
}

