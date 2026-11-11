import { Router } from 'express'
import { listQueries } from '../queries/index.js'
import { runQuery } from '../services/queryRunner.js'
import { isDatabaseUnavailable } from '../services/dbError.js'

const router = Router()

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
    if (isDatabaseUnavailable(error)) {
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
