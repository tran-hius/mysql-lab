import { Router } from 'express'
import healthRoutes from './health.routes.js'
import queriesRoutes from './queries.routes.js'
import sandboxRoutes from './sandbox.routes.js'
import schemaRoutes from './schema.routes.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    name: 'MySQL Lab API',
    version: '0.1.0',
    endpoints: [
      'GET /api/health',
      'GET /api/queries',
      'GET /api/queries/:id',
      'GET /api/schema',
      'POST /api/sandbox',
    ],
  })
})

router.use(healthRoutes)
router.use('/queries', queriesRoutes)
router.use('/sandbox', sandboxRoutes)
router.use('/schema', schemaRoutes)

export default router
