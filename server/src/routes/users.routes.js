import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { updateMyProfile } from '../controllers/users.controller.js'

const router = Router()

router.patch('/me', requireAuth, updateMyProfile)

export default router
