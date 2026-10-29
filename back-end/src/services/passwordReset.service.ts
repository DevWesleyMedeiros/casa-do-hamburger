import * as bcrypt from 'bcrypt-ts';
import { AppError } from '../errors/AppError.js';
import { passwordResetTokenRepository } from '../repositories/passwordResetToken.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
} from '../shared/utils/passwordResetToken.js';
import { resendEmailService } from './email/resendEmail.service.js';

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

const BCRYPT_SALT_ROUNDS = 10; // RN-CRYPT-01 (fator ≥10, 12 em produção)
export const passwordResetService = {
  /**
   * RF-09 / RN-AUTH-15: esta função NUNCA deve fazer o controller distinguir "e-mail existe" de "e-mail não existe" — ela deve sempre resolve normalmente.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // RF-57 / RN-AUTH-10: contas Google não têm passwordHash local — nada a redefinir
    if (!user || user.deletedAt || user.provider !== 'LOCAL' || !user.password) {
      return;
    }
    const { rawToken, tokenHash } = generateResetToken();
    const issued = await passwordResetTokenRepository.replaceActiveToken({
      userId: user.id,
      tokenHash,
      expiresAt: resetTokenExpiresAt(),
    });
    if (!issued) return;
    const resetLink = new URL('/reset-password', FRONTEND_URL);
    resetLink.searchParams.set('token', rawToken);
    const resetUrl = resetLink.toString();
    try {
      await resendEmailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch {
      // Falha de envio fica só no log do EmailService — não deve alterar a
      // resposta genérica que o controller já vai enviar (RN-AUTH-15).
    }
  },
  async resetPassword(rawToken: string, newPassword: string): Promise<'ok' | 'invalid_token'> {
    const tokenHash = hashResetToken(rawToken);
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    try {
      const consumed = await passwordResetTokenRepository.consumeAndUpdatePassword(
        tokenHash,
        newPasswordHash,
      );
      return consumed ? 'ok' : 'invalid_token';
    } catch (error) {
      if (error instanceof AppError && error.status === 401) return 'invalid_token';
      throw error;
    }
  },
};
