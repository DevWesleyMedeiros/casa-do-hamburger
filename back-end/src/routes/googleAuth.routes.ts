import { Router } from 'express'
import { googleAuthBroadLimiter } from '../middlewares/rateLimiter.js'
import { googleAuthController } from '../controllers/googleAuth.controller.js'
import { validateBody } from '../middlewares/validateBody.js'
import { googleAuthSchema } from '../schemas/googleAuthSchema.js'

const router = Router()
// rotas para google auth
router.post(
  '/google',
  validateBody(googleAuthSchema),
  googleAuthBroadLimiter,
  googleAuthController.loginWithGoogle,
)
export default router
