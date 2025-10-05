import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Routes
import healthRouter from './routes/health';
import aoiRouter from './routes/aoi';
import metadataRouter from './routes/metadata';
import tilesRouter from './routes/tiles';
import timeseriesRouter from './routes/timeseries';
import explainRouter from './routes/explain';

const app = express();

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Routes
app.use(healthRouter);
app.use(aoiRouter);
app.use(metadataRouter);
app.use(tilesRouter);
app.use(timeseriesRouter);
app.use(explainRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(config.port, () => {
  console.log(`🪷 Bloomium API running on port ${config.port}`);
  console.log(`   Mode: ${config.mode}`);
  console.log(`   Storage: ${config.mode === 'local' ? config.storagePath : config.gcs.bucket}`);
  console.log(`   Storage Path (full): ${config.storagePath}`);
  console.log(`   CWD: ${process.cwd()}`);
});

