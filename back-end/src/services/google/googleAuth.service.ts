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
import { prisma } from '../../db.js';
import { toJwtPayloadDTO } from '../../dtos/toJwtPayloadDTO.js';
import { AppError } from '../../errors/AppError.js';
import { googleAuthTargetedStore } from '../../middlewares/stores/googleAuthTargetStore.js';
import { userRepository } from '../../repositories/user.repository.js';

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

// Regra RN-AVATAR-01: avatar próprio (avatarKey) tem prioridade sobre o do Google.
/**
 * @description Sincroniza a foto do Google com a foto do usuário, se for válida e não for igual à foto do usuário.
 * @param user usuário a ser sincronizado
 * @param avatarUrl URL da foto do Google
 * @returns usuário atualizado
 * */
async function syncGoogleAvatar(user: User, avatarUrl: string | null): Promise<User> {
  const canSync = avatarUrl && !user.avatarKey && user.avatarUrl !== avatarUrl;
  return canSync ? userRepository.updateGoogleAvatar(user.id, avatarUrl) : user;
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

    if (!decoded.email) {
      throw new AppError(400, 'Conta Google sem e-mail associado');
    }
    // Foto fornecida pelo token Firebase já verificado. Url já sanitizada.
    const avatarUrl = sanitizeGoogleAvatar(decoded['picture']);
    // Usuário já vinculado a esse Firebase UID.
    const byFirebaseUid = await userRepository.findByFirebaseUid(decoded.uid);
    if (byFirebaseUid) {
      const user = await syncGoogleAvatar(byFirebaseUid, avatarUrl); // ← novo
      return { user, token: await signSessionJwt(user) };
    }
    // Usuário existente pelo e-mail ou criação de novo usuário.
    const user = await prisma.user.upsert({
      where: { email: decoded.email },
      update: {
        ...(decoded.email_verified === true
          ? { firebaseUid: decoded.uid, provider: 'GOOGLE' }
          : {}),
      },

      create: {
        name: decoded['name'] ?? decoded.email.split('@')[0] ?? 'Usuário Google',
        email: decoded.email,
        firebaseUid: decoded.uid,
        avatarUrl,
        emailVerified: decoded.email_verified ?? false,
        emailVerifiedAt: decoded.email_verified ? new Date() : null,
        provider: 'GOOGLE',
        cep: '',
      },
    });

    // Se a conta já existia e tentamos vincular sem que o e-mail estar verificado.
    if (user.firebaseUid !== decoded.uid && decoded.email_verified !== true) {
      throw new AppError(
        409,
        'Já existe uma conta com este e-mail. Faça login pela senha local ' +
          'ou verifique seu e-mail no Google antes de tentar novamente.',
      );
    }
    console.log('[GoogleAuth] Autenticação Google processada com sucesso');
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
