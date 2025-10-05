import { Router } from 'express';
import { TimeseriesQuerySchema, TimeseriesResponse } from '../types';
import { storageService } from '../services/storage';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/timeseries', asyncHandler(async (req, res) => {
  const { lat, lon, aoi_id } = TimeseriesQuerySchema.parse(req.query);

  // For demo, return mock time series data
  // In production, this would query actual pixel data from timeseries.json
  try {
    const date = '2025-09-01'; // Default date for now
    const timeseriesData = await storageService.readTimeseries(aoi_id, date);
    
    // Mock response - in real implementation, interpolate based on lat/lon
    const response: TimeseriesResponse = {
      lat,
      lon,
      data: timeseriesData || generateMockTimeseries(),
    };

    res.json(response);
  } catch (error) {
    // Return mock data if file doesn't exist yet
    const response: TimeseriesResponse = {
      lat,
      lon,
      data: generateMockTimeseries(),
    };
    res.json(response);
  }
}));

function generateMockTimeseries() {
  const dates = ['2025-08-01', '2025-08-08', '2025-08-15', '2025-08-22', '2025-09-01', '2025-09-08'];
  return dates.map((date, i) => ({
    date,
    ari: 0.1 + Math.random() * 0.3,
    ndvi: 0.5 + Math.random() * 0.3,
    bloom_probability: Math.sin(i / 3) * 0.5 + 0.5,
  }));
}

export default router;

