import * as bcrypt from 'bcrypt-ts'
import { passwordResetTokenRepository } from '../repositories/passwordResetToken.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
} from '../shared/utils/passwordResetToken.js'
import { resendEmailService } from './email/resendEmail.service.js'

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'

const BCRYPT_SALT_ROUNDS = 10 // RN-CRYPT-01 (fator ≥10, 12 em produção)
export const passwordResetService = {
  /**
   * RF-09 / RN-AUTH-15: esta função NUNCA deve fazer o controller distinguir "e-mail existe" de "e-mail não existe" — ela deve sempre resolve normalmente.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email)
    // RF-57 / RN-AUTH-10: contas Google não têm passwordHash local — nada a redefinir
    if (!user || user.provider === 'GOOGLE') {
      return
    }
    await passwordResetTokenRepository.invalidateActiveTokensForUser(user.id)
    const { rawToken, tokenHash } = generateResetToken()
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: resetTokenExpiresAt(),
    })
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`
    try {
      await resendEmailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      })
    } catch {
      // Falha de envio fica só no log do EmailService — não deve alterar a
      // resposta genérica que o controller já vai enviar (RN-AUTH-15).
    }
  },
  async resetPassword(rawToken: string, newPassword: string): Promise<'ok' | 'invalid_token'> {
    const tokenHash = hashResetToken(rawToken)
    const resetToken = await passwordResetTokenRepository.findValidByHash(tokenHash)

    if (!resetToken) {
      return 'invalid_token'
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

    await Promise.all([
      userRepository.updatePasswordHash(resetToken.userId, newPasswordHash),
      passwordResetTokenRepository.markAsUsed(resetToken.id),
    ])

    return 'ok'
  },
}
