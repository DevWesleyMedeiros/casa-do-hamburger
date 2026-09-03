import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { passwordResetController } from '../controllers/passwordReset.controller.js'
import { requireAuth } from '../middlewares/authMiddlewares.js'
import { requiredAdmin } from '../middlewares/requiredAdmin.js'
import { clearAuthCookie } from '../middlewares/clearAuthCookie.js'
import {
  forgotPasswordBroadLimiter,
  forgotPasswordEmailLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordBroadLimiter,
} from '../middlewares/rateLimiter.js'
import { validateBody } from '../middlewares/validateBody.js'
import { loginSchema, registerSchema } from '../schemas/authSchemas.js'
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/passwordReset.schema.js'

const router = Router()

// Ordem intencional: valida Zod ANTES de gastar cota do rate limiter. Assim, payloads inválidos (formato de email errado, campos faltando etc.) são rejeitados sem incrementar contador, evitando DoS de validação e bloqueios injustos de usuários legítimos que só erraram o formato
router.post('/login', validateBody(loginSchema), loginLimiter, authController.login)
router.get('/me', requireAuth, requiredAdmin, authController.userAuth)
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

