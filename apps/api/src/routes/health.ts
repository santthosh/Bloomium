import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: config.mode,
    version: '0.1.0',
  });
});

export default router;

