/**
 * Camada de regra de negócio do login social via Google (RF-51 a RF-55).
 *
 * Responsabilidades:
 * - Verificar o Firebase ID Token recebido do frontend.
 * - Fazer find-or-create do usuário.
 * - Aplicar o gate de segurança antes de vincular automaticamente
 *   uma conta Google a uma conta LOCAL existente.
 * - Emitir exatamente o mesmo JWT de sessão usado pelo login local.
 */

import * as jose from 'jose';
import type { User } from '../../../generated/prisma/index.js';
import { verifyFirebaseIdToken } from '../../config/firebaseAdmin.js';
import { getJwtSecret } from '../../config/jwt.js';
import { authenticateGoogleIdentity } from '../../repositories/googleIdentity.repository.js';
import { verifiedGoogleEmail } from './verifiedGoogleIdentity.js';
import { toJwtPayloadDTO } from '../../dtos/toJwtPayloadDTO.js';
import { AppError } from '../../errors/AppError.js';
import { googleAuthTargetedStore } from '../../middlewares/stores/googleAuthTargetStore.js';

// Aplica rate limiting direcionado por UID do Google após decodificar o token.
async function checkGoogleTargetedRateLimit(uid: string): Promise<void> {
  const key = uid;
  const { totalHits, resetTime } = await googleAuthTargetedStore.increment(key);
  if (totalHits > 5) {
    const retryAfter = Math.ceil(((resetTime?.getTime() ?? 0) - Date.now()) / 1000);
    throw new AppError(
      429,
      `Muitas tentativas de login para esta conta. Tente novamente em ${retryAfter} segundos.`,
    );
  }
}

// Só aceitamos foto servida pelo domínio de imagens do Google, via HTTPS.
/**
 * @description Sanitiza a URL da foto do Google, se for válida.
 * Só aceita fotos servidas pelo domínio de imagens do Google, via HTTPS.
 * @param picture URL da foto do Google
 * @returns URL sanitizada, se for válida; null, se não for válida.
 */
function sanitizeGoogleAvatar(picture: unknown): string | null {
  if (typeof picture !== 'string') return null;
  try {
    const url = new URL(picture);
    const isGoogleHost = url.hostname.endsWith('.googleusercontent.com');
    if (url.protocol !== 'https:' || !isGoogleHost) return null;
    // O Google devolve =s96-c (96px). Pedimos 256px para ficar nítido em telas retina.
    return url.toString().replace(/=s\d+-c$/, '=s256-c');
  } catch {
    return null;
  }
}

export const googleAuthService = {
  /**
   * @description Realiza o login social via Google.
   * @param idToken do Firebase ID Token enviado pelo frontend (req.body).
   * @throws AppError se o token Firebase for inválido ou expirado.
   * @returns Um objeto DTO de perfil do usuário e um JWT de sessão.
   */
  loginWithGoogle: async (idToken: string) => {
    let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
      console.log('[GoogleAuth] Token Firebase verificado com sucesso');

      // Rate limiting direcionado por UID.
      await checkGoogleTargetedRateLimit(decoded['uid']);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[GoogleAuth] Erro ao verificar token Firebase');
      throw new AppError(401, 'Autenticação com Google inválida ou expirada');
    }

    const email = verifiedGoogleEmail(decoded);
    const user = await authenticateGoogleIdentity({
      uid: decoded.uid,
      email,
      name: decoded['name'] ?? email.split('@')[0] ?? 'Usuário Google',
      avatarUrl: sanitizeGoogleAvatar(decoded['picture']),
    });
    return {
      user,
      token: await signSessionJwt(user),
    };
  },
};

// Os três fluxos terminam usando exatamente o mesmo formato de JWT.
async function signSessionJwt(user: User): Promise<string> {
  return new jose.SignJWT(toJwtPayloadDTO(user))
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}
