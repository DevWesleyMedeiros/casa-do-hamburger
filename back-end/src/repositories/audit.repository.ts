import { Prisma } from '../../generated/prisma/index.js';
import { prisma } from '../db.js';
import type { AuditEvent, AuditQuery } from '../schemas/audit.schema.js';

export const auditRepository = {
  append: (
    tx: Prisma.TransactionClient,
    event: AuditEvent & { actorId: string; requestId: string },
  ) =>
    tx.auditLog.create({
      data: {
        ...event,
        before: event.before ?? Prisma.DbNull,
        after: event.after ?? Prisma.DbNull,
      },
    }),

  list: (query: AuditQuery) => {
    const { cursor, from, to } = query;
    const where: Prisma.AuditLogWhereInput = {
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorId: query.actorId,
      createdAt: from && to ? { gte: new Date(from), lt: new Date(to) } : undefined,
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
            ],
          }
        : {}),
    };
    return prisma.auditLog.findMany({
      where,
      take: query.limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  },
};
