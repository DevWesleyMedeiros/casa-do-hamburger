import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { withUserLock } from './userLock.js';

interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export async function authenticateGoogleIdentity(identity: VerifiedGoogleIdentity) {
  const byUid = await prisma.user.findUnique({ where: { firebaseUid: identity.uid } });
  let candidate = byUid;
  if (!candidate) {
    try {
      candidate = await prisma.user.upsert({
        where: { email: identity.email },
        update: {}, // Nunca sobrescreve uma identidade já vinculada.
        create: {
          name: identity.name,
          email: identity.email,
          firebaseUid: identity.uid,
          provider: 'GOOGLE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          avatarUrl: identity.avatarUrl,
        },
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new AppError(409, 'Identidade já vinculada. Tente entrar novamente.');
      }
      throw error;
    }
  }
  return withUserLock(candidate.id, async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: candidate.id } });
    if (user.firebaseUid && user.firebaseUid !== identity.uid) {
      throw new AppError(409, 'Esta conta já possui outra identidade vinculada');
    }
    return tx.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: identity.uid,
        emailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        // Vincular Google não remove a senha/método LOCAL da conta existente.
        ...(!user.avatarKey && identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
      },
    });
  });
}
