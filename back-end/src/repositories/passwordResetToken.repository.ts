import { prisma } from '../db.js';
import { withUserLock } from './userLock.js';

export const passwordResetTokenRepository = {
  async replaceActiveToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return withUserLock(data.userId, async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: data.userId } });
      if (user.provider !== 'LOCAL' || !user.password) return false;
      await tx.passwordResetToken.deleteMany({ where: { userId: data.userId, usedAt: null } });
      await tx.passwordResetToken.create({ data });
      return true;
    });
  },

  async consumeAndUpdatePassword(tokenHash: string, password: string): Promise<boolean> {
    // Apenas descobre o usuário; a validade é decidida dentro do lock.
    const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token) return false;
    return withUserLock(token.userId, async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: token.userId } });
      if (user.provider !== 'LOCAL' || !user.password) return false;
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;
      // Falha na senha reverte também o consumo do token.
      await tx.user.update({ where: { id: token.userId }, data: { password } });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      return true;
    });
  },
};
