import { Router } from 'express'
import { listQueries } from '../queries/index.js'
import { runQuery } from '../services/queryRunner.js'

const router = Router()

const DB_ERRORS = new Set(['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'])

router.get('/', (req, res) => {
  res.json({ ok: true, queries: listQueries() })
})

router.get('/:id', async (req, res, next) => {
  try {
    const result = await runQuery(req.params.id)

    if (!result) {
      return res.status(404).json({
        ok: false,
        error: 'QUERY_NOT_FOUND',
        message: `Không có truy vấn "${req.params.id}"`,
      })
    }

    res.json({ ok: true, ...result })
  } catch (error) {
    if (DB_ERRORS.has(error.code)) {
      return res.status(503).json({
        ok: false,
        error: 'DB_UNAVAILABLE',
        message: 'Không kết nối được MySQL.',
        hint: 'Kiểm tra backend/.env và service MySQL84.',
      })
    }

    next(error)
  }
})

export default router
