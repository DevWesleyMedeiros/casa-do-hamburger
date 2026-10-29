import type { DecodedIdToken } from 'firebase-admin/auth';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';

export function verifiedGoogleEmail(decoded: DecodedIdToken): string {
  if (decoded.firebase?.sign_in_provider !== 'google.com' || !decoded.uid) {
    throw new AppError(401, 'Autenticação com Google inválida ou expirada');
  }
  if (decoded.email_verified !== true) {
    throw new AppError(409, 'Verifique seu e-mail no Google antes de entrar');
  }
  // O cadastro local preserva a capitalização: não canonicalizar só este fluxo.
  const email = z.email().safeParse(decoded.email?.trim());
  if (!email.success) throw new AppError(400, 'Conta Google sem e-mail válido associado');
  return email.data;
}
