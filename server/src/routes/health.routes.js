import { Router } from 'express'

const router = Router()

// GET /api/health — used by Render and by us to check the server is running.
router.get('/', (request, response) => {
  response.json({ ok: true })
})

export default router
