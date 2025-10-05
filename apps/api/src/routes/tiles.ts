import { Router } from 'express';
import { storageService } from '../services/storage';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/tiles/:layer/:z/:x/:y', asyncHandler(async (req, res) => {
  const { layer, z, x, y } = req.params;
  
  // Validate layer
  if (layer !== 'bloom' && layer !== 'anomaly') {
    throw new AppError(400, 'Invalid layer. Must be "bloom" or "anomaly"');
  }

  // Parse coordinates
  const zNum = parseInt(z, 10);
  const xNum = parseInt(x, 10);
  const yNum = parseInt(y.replace('.png', ''), 10);

  // For demo, use default AOI and date
  // TODO: Add query params for aoi_id and date selection
  const aoi_id = req.query.aoi_id as string || 'demo-aoi-1';
  const date = req.query.date as string || '2025-09-01';

  try {
    const tileBuffer = await storageService.readTile(aoi_id, date, layer, zNum, xNum, yNum);
    
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.send(tileBuffer);
  } catch (error) {
    throw new AppError(404, `Tile not found: ${layer}/${z}/${x}/${y}`);
  }
}));

export default router;

