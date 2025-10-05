import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { aoiService } from '../services/aoi';
import { storageService } from '../services/storage';

const router = Router();

// Get AOI metadata including available dates
router.get('/aoi/:aoi_id/metadata', asyncHandler(async (req, res) => {
  const { aoi_id } = req.params;
  
  let aoi = await aoiService.getById(aoi_id);
  
  // If AOI not in Firestore, try to discover from GCS
  if (!aoi) {
    try {
      const dates = await storageService.discoverDates(aoi_id);
      if (dates.length > 0) {
        // Read bbox from first available meta.json
        const meta = await storageService.readMeta(aoi_id, dates[0]);
        aoi = {
          aoi_id,
          bbox: meta.bbox,
          dates,
          name: aoi_id,
        };
      }
    } catch (error) {
      // AOI truly doesn't exist
    }
  }
  
  if (!aoi) {
    return res.status(404).json({ error: 'AOI not found' });
  }

  res.json({
    aoi_id: aoi.aoi_id,
    name: aoi.name,
    bbox: aoi.bbox,
    dates: aoi.dates || [],
  });
}));

export default router;

