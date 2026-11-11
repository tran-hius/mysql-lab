import { Router } from 'express';
import { getSchema } from '../services/schemaExplorer.js';
import { isDatabaseUnavailable } from '../services/dbError.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schema = await getSchema();
    res.json({ ok: true, ...schema });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return res.status(503).json({
        ok: false,
        error: 'DB_UNAVAILABLE',
        message: 'Không kết nối được MySQL.',
        hint: 'Kiểm tra backend/.env và service MySQL84.',
      });
    }

    next(error);
  }
});

export default router;
