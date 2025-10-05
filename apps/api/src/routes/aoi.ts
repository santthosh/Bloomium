import { Router } from 'express';
import { AOIResolveRequestSchema } from '../types';
import { aoiService } from '../services/aoi';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/aoi/resolve', asyncHandler(async (req, res) => {
  const { name, bbox } = AOIResolveRequestSchema.parse(req.body);
  
  const aoi_id = await aoiService.resolveAOI(name, bbox);
  
  res.json({
    aoi_id,
    name,
    bbox,
  });
}));

export default router;

