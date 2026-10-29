import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLog, Prisma } from '../../../generated/prisma/index.js';
import { toAuditDTO } from '../../dtos/audit.dto.js';
import { auditRepository } from '../../repositories/audit.repository.js';
import {
  auditContextSchema,
  auditQuerySchema,
  encodeAuditCursor,
  sanitizeAuditEvent,
} from '../../schemas/audit.schema.js';
import { auditService, orderAuditEvent } from '../../services/audit.service.js';

vi.mock('../../repositories/audit.repository.js', () => ({
  auditRepository: { append: vi.fn(), list: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());
const actor = { id: randomUUID(), admin: true, requestId: randomUUID() };
const event = {
  action: 'PRODUCT_CREATED',
  entityType: 'PRODUCT',
  entityId: 'product-id',
  before: null,
  after: { name: 'Produto', category: 'HAMBURGUER', price: 2990 },
} as const;
const record = (): AuditLog => ({
  ...event,
  id: randomUUID(),
  actorId: actor.id,
  requestId: actor.requestId,
  createdAt: new Date('2026-10-29T12:00:00Z'),
});

describe('RF-45 contratos e lista permitida', () => {
  it('descarta segredos e campos privados na construção e no DTO', () => {
    const extra = {
      password: 'secret-password',
      token: 'secret-token',
      email: 'private@example.invalid',
      cookies: 'secret-cookie',
    };
    const input = {
      ...event,
      ...extra,
      after: {
        ...event.after,
        ...extra,
        description: 'Não necessário',
        images: [{ key: 'private-key' }],
      },
    };
    expect(sanitizeAuditEvent(input)).toEqual(event);
    const dto = toAuditDTO({ ...record(), after: input.after });
    expect(dto.after).toEqual(event.after);
    expect(Object.keys(dto).sort()).toEqual([
      'action',
      'actorId',
      'after',
      'before',
      'createdAt',
      'entityId',
      'entityType',
      'id',
      'requestId',
    ]);
    expect(JSON.stringify(dto)).not.toMatch(/secret|private|password|cookies|images|description/);
  });
  it.each(['PRODUCT_UPDATED', 'LOGIN', '', 'DROP TABLE'])(
    'rejeita ação não implementada %s',
    (action) => {
      expect(() => sanitizeAuditEvent({ ...event, action })).toThrow();
    },
  );
  it('rejeita entidade incompatível, transição sem mudança e cancelamento mal classificado', () => {
    expect(() => sanitizeAuditEvent({ ...event, entityType: 'ORDER' })).toThrow();
    expect(() => orderAuditEvent('order', 'PENDING', 'PENDING')).toThrow();
    expect(orderAuditEvent('order', 'PREPARING', 'CANCELLED').action).toBe('ORDER_CANCELLED');
    expect(() =>
      sanitizeAuditEvent({
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'ORDER',
        entityId: 'order',
        before: { status: 'PENDING' },
        after: { status: 'CANCELLED' },
      }),
    ).toThrow();
    expect(() => orderAuditEvent('order', 'DELIVERED', 'CANCELLED')).toThrow();
  });
  it('DTO não publica registros inválidos como eventos válidos', () => {
    expect(() => toAuditDTO({ ...record(), after: { status: 'PENDING' } })).toThrow(
      'Registro de auditoria inválido',
    );
    expect(
      auditContextSchema.safeParse({ actorId: 'client', requestId: actor.requestId }).success,
    ).toBe(false);
  });
  it.each([
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { cursor: 'invalid' },
    { action: ['PRODUCT_CREATED'] },
    { from: '2026-01-01T00:00:00Z' },
    { from: '2026-01-02T00:00:00Z', to: '2026-01-01T00:00:00Z' },
    { from: '2020-01-01T00:00:00Z', to: '2026-01-01T00:00:00Z' },
    { actorId: 'invalid' },
    { unknown: 'value' },
  ])('rejeita filtros inválidos %j', (query) => {
    expect(auditQuerySchema.safeParse(query).success).toBe(false);
  });
  it('valida cursor composto e limites padrão/máximo', () => {
    const value = { createdAt: '2026-10-29T12:00:00.000Z', id: randomUUID() };
    expect(auditQuerySchema.parse({ cursor: encodeAuditCursor(value), limit: '100' })).toEqual({
      cursor: value,
      limit: 100,
    });
    expect(auditQuerySchema.parse({})).toEqual({ limit: 20 });
  });
  it('rejeita ator comum antes de gravar e não imprime erros brutos de persistência', async () => {
    const tx = {} as Prisma.TransactionClient;
    await expect(auditService.record(tx, { ...actor, admin: false }, event)).rejects.toMatchObject({
      status: 403,
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(auditRepository.append).mockRejectedValue(new Error('secret-database-error'));
    await expect(auditService.record(tx, actor, event)).rejects.toThrow();
    expect(log.mock.calls).toEqual([['[AUDIT_WRITE_FAILED]', { requestId: actor.requestId }]]);
    log.mockRestore();
  });
  it('pagina com cursor do último item entregue e retorna DTO mínimo', async () => {
    const records = [record(), record(), record()];
    vi.mocked(auditRepository.list).mockResolvedValue(records);
    const page = await auditService.list({ limit: 2 });
    expect(page.items.map((item) => item.id)).toEqual(records.slice(0, 2).map((item) => item.id));
    expect(auditQuerySchema.parse({ cursor: page.nextCursor }).cursor).toEqual({
      id: records[1]!.id,
      createdAt: records[1]!.createdAt.toISOString(),
    });
    vi.mocked(auditRepository.list).mockResolvedValue([]);
    expect(await auditService.list({})).toEqual({ items: [], nextCursor: null });
  });
});
