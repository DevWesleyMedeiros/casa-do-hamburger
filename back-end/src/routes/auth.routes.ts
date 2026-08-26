import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { clearAuthCookie } from '../middlewares/clearAuthCookie.js'
import {
  forgotPasswordBroadLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordBroadLimiter,
  loginLimiter,
  registerLimiter,
} from '../middlewares/rateLimiter.js'
import { validateBody } from '../middlewares/validateBody.js'
import { loginSchema, registerSchema } from '../schemas/authSchemas.js'
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/passwordReset.schema.js'
import { passwordResetController } from '../controllers/passwordReset.controller.js'

const router = Router()

// Ordem intencional: valida Zod ANTES de gastar cota do rate limiter. Assim, payloads inválidos (formato de email errado, campos faltando etc.) são rejeitados sem incrementar contador, evitando DoS de validação e bloqueios injustos de usuários legítimos que só erraram o formato
router.post('/login', validateBody(loginSchema), loginLimiter, authController.login)
router.get('/me', requireAuth, authController.userAuth)
router.post('/register', validateBody(registerSchema), registerLimiter, authController.register)
router.post('/logout', requireAuth, clearAuthCookie, authController.logout)

// rotas para forgot password
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  forgotPasswordBroadLimiter,
  forgotPasswordEmailLimiter,
  passwordResetController.forgotPassword,
)

// rotas para reset-password
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  resetPasswordBroadLimiter,
  passwordResetController.resetPassword,
)

export default router
