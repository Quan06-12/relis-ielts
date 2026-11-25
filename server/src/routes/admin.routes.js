import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'
import { getStats } from '../controllers/admin.controller.js'

// Everything under /api/admin needs a signed-in admin (ADMIN_EMAILS)
const router = Router()

router.use(requireAuth, requireAdmin)
router.get('/stats', getStats)

export default router
