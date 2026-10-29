import type { Prisma } from '../../generated/prisma/index.js';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';

// Serializa operações do mesmo usuário, inclusive quando o carrinho está vazio.
export function withUserLock<T>(
  userId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      const users = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "User" WHERE "id" = ${userId} AND "deletedAt" IS NULL FOR UPDATE
    `;
      if (users.length !== 1) throw new AppError(401, 'Usuário não autenticado');
      return operation(tx);
    },
    { isolationLevel: 'ReadCommitted' },
  );
}
