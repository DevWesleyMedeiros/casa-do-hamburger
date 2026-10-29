import type { AuditLog } from '../../generated/prisma/index.js';
import { AppError } from '../errors/AppError.js';
import { sanitizeAuditEvent, type AuditEvent } from '../schemas/audit.schema.js';

export type AuditLogDTO = AuditEvent & {
  id: string;
  actorId: string;
  requestId: string;
  createdAt: string;
};
export interface AuditPageDTO {
  items: AuditLogDTO[];
  nextCursor: string | null;
}

export function toAuditDTO(record: AuditLog): AuditLogDTO {
  try {
    const event = sanitizeAuditEvent(record);
    return {
      ...event,
      id: record.id,
      actorId: record.actorId,
      requestId: record.requestId,
      createdAt: record.createdAt.toISOString(),
    };
  } catch {
    throw new AppError(500, 'Registro de auditoria inválido');
  }
}
