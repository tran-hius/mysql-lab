import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'MySQL Lab API',
    version: '0.1.0',
    endpoints: ['GET /api/health'],
  });
});

router.use(healthRoutes);

export default router;
