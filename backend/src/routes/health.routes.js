import { Router } from 'express';
import { getDatabaseInfo } from '../config/db.js';

const router = Router();

/** GET /api/health — kiểm tra API và kết nối MySQL. */
router.get('/health', async (req, res) => {
  const startedAt = Date.now();

  try {
    const database = await getDatabaseInfo();
    res.json({
      ok: true,
      api: { status: 'up', uptimeSeconds: Math.round(process.uptime()) },
      database: { status: 'connected', ...database },
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      api: { status: 'up', uptimeSeconds: Math.round(process.uptime()) },
      database: {
        status: 'disconnected',
        error: error.code ?? error.message,
      },
      hint: 'Kiểm tra backend/.env và đảm bảo MySQL đã chạy.',
    });
  }
});

export default router;
