import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  mode: process.env.MODE || 'local',
  storagePath: process.env.STORAGE_PATH || './local-data',
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

