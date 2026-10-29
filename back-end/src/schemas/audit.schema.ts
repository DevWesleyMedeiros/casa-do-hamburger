import { z } from 'zod';

export const auditActionSchema = z.enum([
  'PRODUCT_CREATED',
  'PRODUCT_DELETED',
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
]);
const status = z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']);
const product = z.object({
  name: z.string().max(80),
  category: z.string().max(80),
  price: z.number().int().positive().max(2_147_483_647),
});
const order = z.object({ status });
const entityId = z.string().min(1).max(128);

/** Lista permitida por ação: propriedades extras nunca chegam à persistência. */
export const auditEventSchema = z
  .discriminatedUnion('action', [
    z.object({
      action: z.literal('PRODUCT_CREATED'),
      entityType: z.literal('PRODUCT'),
      entityId,
      before: z.null(),
      after: product,
    }),
    z.object({
      action: z.literal('PRODUCT_DELETED'),
      entityType: z.literal('PRODUCT'),
      entityId,
      before: product,
      after: z.null(),
    }),
    z.object({
      action: z.literal('ORDER_STATUS_CHANGED'),
      entityType: z.literal('ORDER'),
      entityId,
      before: order,
      after: order,
    }),
    z.object({
      action: z.literal('ORDER_CANCELLED'),
      entityType: z.literal('ORDER'),
      entityId,
      before: order,
      after: z.object({ status: z.literal('CANCELLED') }),
    }),
  ])
  .superRefine((event, context) => {
    if (event.entityType !== 'ORDER') return;
    if (
      event.before.status === event.after.status ||
      (event.action === 'ORDER_STATUS_CHANGED' && event.after.status === 'CANCELLED') ||
      (event.action === 'ORDER_CANCELLED' &&
        !['PENDING', 'PREPARING'].includes(event.before.status))
    )
      context.addIssue({ code: 'custom', message: 'Transição de auditoria inválida' });
  });
export type AuditEvent = z.infer<typeof auditEventSchema>;
export const sanitizeAuditEvent = (input: unknown): AuditEvent => auditEventSchema.parse(input);
export const auditContextSchema = z.object({ actorId: z.uuid(), requestId: z.uuid() });

const cursorValueSchema = z.strictObject({ createdAt: z.iso.datetime(), id: z.uuid() });
export type AuditCursor = z.infer<typeof cursorValueSchema>;
const cursor = z
  .string()
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((value, context) => {
    try {
      return cursorValueSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    } catch {
      context.addIssue({ code: 'custom', message: 'Cursor inválido' });
      return z.NEVER;
    }
  });
export const encodeAuditCursor = (value: AuditCursor): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

export const auditQuerySchema = z
  .strictObject({
    action: auditActionSchema.optional(),
    entityType: z.enum(['PRODUCT', 'ORDER']).optional(),
    entityId: entityId.optional(),
    actorId: z.uuid().optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: cursor.optional(),
  })
  .superRefine(({ from, to }, context) => {
    if (
      (from === undefined) !== (to === undefined) ||
      (from &&
        to &&
        !(
          Date.parse(to) > Date.parse(from) && Date.parse(to) - Date.parse(from) <= 366 * 86_400_000
        ))
    )
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'Informe início e fim exclusivos válidos, com até 366 dias',
      });
  });
export type AuditQuery = z.infer<typeof auditQuerySchema>;
