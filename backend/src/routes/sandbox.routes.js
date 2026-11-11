import { Router } from 'express';
import { assertPracticeSql } from '../services/practiceGuard.js';
import { runPracticeSql } from '../services/practiceRunner.js';
import { isDatabaseUnavailable } from '../services/dbError.js';

const router = Router();

router.post('/', async (req, res) => {
  const sql = req.body?.sql;

  try {
    assertPracticeSql(sql, { allowExplain: true });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: 'SQL_NOT_ALLOWED',
      message: error.message,
    });
  }

  try {
    const result = await runPracticeSql(sql);
    return res.json({ ok: true, ...result });
  } catch (error) {
    if (error.code === 'QUERY_TIMEOUT') {
      return res.status(422).json({
        ok: false,
        error: 'QUERY_TIMEOUT',
        message: error.message,
      });
    }

    if (isDatabaseUnavailable(error)) {
      return res.status(503).json({
        ok: false,
        error: 'DB_UNAVAILABLE',
        message: 'Không kết nối được MySQL.',
        hint: 'Kiểm tra backend/.env và service MySQL84.',
      });
    }

    return res.status(422).json({
      ok: false,
      error: 'SQL_ERROR',
      message: error.message,
    });
  }
});

export default router;
