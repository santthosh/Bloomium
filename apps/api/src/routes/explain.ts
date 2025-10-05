import { Router } from 'express';
import { ExplainQuerySchema, ExplainResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/explain', asyncHandler(async (req, res) => {
  const { lat, lon, date } = ExplainQuerySchema.parse(req.query);

  // Mock explanation - in production, this would compute real statistics
  const ari = 0.15 + Math.random() * 0.2;
  const delta_ari = Math.random() * 0.1 - 0.05;
  const z_score = delta_ari / 0.02; // Simplified z-score

  const response: ExplainResponse = {
    lat,
    lon,
    date,
    ari,
    delta_ari,
    z_score,
    confidence: Math.abs(z_score) > 2 ? 0.9 : 0.6,
    explanation: generateExplanation(ari, delta_ari, z_score),
  };

  res.json(response);
}));

function generateExplanation(ari: number, delta: number, z_score: number): string {
  const ariLevel = ari > 0.25 ? 'high' : ari > 0.15 ? 'moderate' : 'low';
  const trend = delta > 0.02 ? 'increasing' : delta < -0.02 ? 'decreasing' : 'stable';
  const anomaly = Math.abs(z_score) > 2 ? 'significant anomaly' : 'normal variation';

  return `This location shows ${ariLevel} anthocyanin levels (ARI: ${ari.toFixed(3)}). ` +
         `The index is ${trend} (Δ${delta.toFixed(3)}), representing a ${anomaly} ` +
         `(z-score: ${z_score.toFixed(2)}). ${Math.abs(z_score) > 2 ? 'Blooms are likely occurring.' : 'No strong bloom signal detected.'}`;
}

export default router;

