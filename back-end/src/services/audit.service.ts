import { randomUUID } from 'node:crypto';
import type { OrderStatus, Prisma } from '../../generated/prisma/index.js';
import { toAuditDTO, type AuditPageDTO } from '../dtos/audit.dto.js';
import { AppError } from '../errors/AppError.js';
import { auditRepository } from '../repositories/audit.repository.js';
import {
  auditContextSchema,
  auditQuerySchema,
  encodeAuditCursor,
  sanitizeAuditEvent,
  type AuditEvent,
} from '../schemas/audit.schema.js';

export interface AuditActor {
  id: string;
  admin: boolean;
  requestId?: string;
}
export const auditService = {
  async record(tx: Prisma.TransactionClient, actor: AuditActor, input: AuditEvent): Promise<void> {
    if (!actor.admin) throw new AppError(403, 'Acesso administrativo necessário');
    const context = auditContextSchema.parse({
      actorId: actor.id,
      requestId: actor.requestId ?? randomUUID(),
    });
    const event = sanitizeAuditEvent(input);
    try {
      await auditRepository.append(tx, { ...event, ...context });
    } catch (error) {
      console.error('[AUDIT_WRITE_FAILED]', { requestId: context.requestId });
      throw error;
    }
  },

  async list(input: unknown): Promise<AuditPageDTO> {
    const query = auditQuerySchema.parse(input);
    const records = await auditRepository.list(query);
    const hasMore = records.length > query.limit;
    const items = records.slice(0, query.limit).map(toAuditDTO);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        hasMore && last ? encodeAuditCursor({ id: last.id, createdAt: last.createdAt }) : null,
    };
  },
};

export function orderAuditEvent(
  entityId: string,
  before: OrderStatus,
  after: OrderStatus,
): AuditEvent {
  return sanitizeAuditEvent({
    action: after === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
    entityType: 'ORDER',
    entityId,
    before: { status: before },
    after: { status: after },
  });
}
