import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
// Get project root: go up 3 levels from src dir (/app/apps/api/src -> /app)
const projectRoot = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
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
  firestore: {
    collections: {
      aois: process.env.FIRESTORE_COLLECTION_AOIS || 'aois',
      jobs: process.env.FIRESTORE_COLLECTION_JOBS || 'jobs',
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

export const isCloudMode = () => config.mode === 'cloud';
export const isLocalMode = () => config.mode === 'local';

