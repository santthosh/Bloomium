import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
// Get project root: go up 3 levels from src dir (/app/apps/worker/src -> /app)
const projectRoot = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

export const config = {
  mode: process.env.MODE || 'local',
  storagePath: process.env.STORAGE_PATH && path.isAbsolute(process.env.STORAGE_PATH)
    ? process.env.STORAGE_PATH  // Use absolute path as-is (e.g., /data in docker)
    : process.env.STORAGE_PATH
    ? path.resolve(projectRoot, process.env.STORAGE_PATH)  // Resolve relative to project root
    : path.join(projectRoot, 'local-data'),  // Default
  gcs: {
    bucket: process.env.GCS_BUCKET || 'bloomium-tiles',
    projectId: process.env.GCP_PROJECT_ID || '',
  },
  stac: {
    endpoint: process.env.STAC_ENDPOINT || 'https://earth-search.aws.element84.com/v1',
    dataSource: process.env.DATA_SOURCE || 'earth-search',
  },
  tiles: {
    zMin: parseInt(process.env.TILE_Z_MIN || '7'),
    zMax: parseInt(process.env.TILE_Z_MAX || '14'),
    size: 256,
  },
  processing: {
    maxScenesPerWeek: parseInt(process.env.MAX_SCENES_PER_WEEK || '2'),
    downloadConcurrency: parseInt(process.env.DOWNLOAD_CONCURRENCY || '3'),
    epsilon: parseFloat(process.env.EPSILON || '1e-4'),
  },
};

export const isCloudMode = () => config.mode === 'cloud';
export const isLocalMode = () => config.mode === 'local';

