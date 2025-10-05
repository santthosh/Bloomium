import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Get project root (3 levels up from dist or src)
const projectRoot = path.resolve(__dirname, '../../..');

export const config = {
  mode: process.env.MODE || 'local',
  storagePath: process.env.STORAGE_PATH 
    ? path.resolve(process.cwd(), process.env.STORAGE_PATH)
    : path.join(projectRoot, 'local-data'),
  gcs: {
    bucket: process.env.GCS_BUCKET || 'bloomium-tiles',
    projectId: process.env.GCP_PROJECT_ID || '',
  },
};

export const isCloudMode = () => config.mode === 'cloud';
export const isLocalMode = () => config.mode === 'local';

