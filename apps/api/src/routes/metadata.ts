import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { aoiService } from '../services/aoi';

const router = Router();

// Get AOI metadata including available dates
router.get('/aoi/:aoi_id/metadata', asyncHandler(async (req, res) => {
  const { aoi_id } = req.params;
  
  const aoi = await aoiService.getById(aoi_id);
  
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

