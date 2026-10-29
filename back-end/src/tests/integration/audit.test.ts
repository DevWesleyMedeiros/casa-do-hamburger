import './safety.js';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { getJwtSecret } from '../../config/jwt.js';
import { prisma } from '../../db.js';
import { OrderRepository } from '../../repositories/order.respository.js';
import { auditService, orderAuditEvent } from '../../services/audit.service.js';
import { uploadImageToCloudinary } from '../../services/uploads/cloudinary.service.js';

const userIds: string[] = [];
const productIds: string[] = [];
let admin: { id: string; cookie: string };
let common: { id: string; cookie: string };
const path = '/admin/audit-logs';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0MsAAAAASUVORK5CYII=',
  'base64',
);
async function account(isAdmin: boolean) {
  const user = await prisma.user.create({
    data: { name: 'Nome privado', email: `${randomUUID()}@example.invalid`, admin: isAdmin },
  });
  userIds.push(user.id);
  // Claim antigo de admin=true não concede permissão à conta comum.
  const token = await new SignJWT({ id: user.id, admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getJwtSecret());
  return { id: user.id, cookie: `user_section=${token}` };
}
async function product() {
  const item = await prisma.products.create({
    data: {
      name: 'Produto histórico',
      description: 'Não deve ser auditada',
      price: 2990,
      category: 'HAMBURGUER',
    },
  });
  productIds.push(item.id);
  return item;
}
const order = (status: 'PENDING' | 'READY' = 'PENDING') =>
  prisma.order.create({
    data: { userId: common.id, customerName: 'Cliente privado', total: 2990, status },
  });
const events = (entityId: string) =>
  prisma.auditLog.findMany({ where: { entityId }, orderBy: { createdAt: 'asc' } });
const createProduct = (name = 'Produto auditado') =>
  request(app)
    .post('/auth/products')
    .set('Cookie', admin.cookie)
    .set('X-Request-Id', 'client-controlled')
    .field('name', name)
    .field('description', 'Descrição não auditável')
    .field('category', 'HAMBURGUER')
    .field('price', '2990')
    .field('actorId', common.id)
    .field('password', 'forbidden-secret')
    .attach('image', png, 'test.png');

beforeAll(async () => {
  admin = await account(true);
  common = await account(false);
  vi.mocked(uploadImageToCloudinary).mockResolvedValue({
    url: 'https://example.invalid/image.png',
    key: 'not-auditable-key',
    mimeType: 'image/png',
    size: png.length,
  });
});
afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.products.deleteMany({ where: { id: { in: productIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe('RF-45 API e transações reais em PostgreSQL descartável', () => {
  it('ADMIN cria produto e persiste somente campos permitidos com ator/requestId confiáveis', async () => {
    const response = await createProduct();
    expect(response.status).toBe(201);
    productIds.push(response.body.id as string);
    const [event] = await events(response.body.id);
    expect(event).toMatchObject({
      actorId: admin.id,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      before: null,
      after: { name: 'Produto auditado', category: 'HAMBURGUER', price: 2990 },
    });
    expect(event!.requestId).toBe(response.headers['x-request-id']);
    expect(event!.requestId).not.toBe('client-controlled');
    expect(event!.createdAt).toBeInstanceOf(Date);
    expect(JSON.stringify(event)).not.toMatch(
      /forbidden|password|description|mimeType|not-auditable|Cliente privado|Nome privado/,
    );
  });

  it('status registra anterior/novo e repetição não gera segundo sucesso', async () => {
    const item = await order();
    const update = () =>
      request(app)
        .patch(`/orders/${item.id}/status`)
        .set('Cookie', admin.cookie)
        .send({ status: 'PREPARING', actorId: common.id });
    expect((await update()).status).toBe(200);
    expect((await update()).status).toBe(422);
    expect(await events(item.id)).toMatchObject([
      {
        action: 'ORDER_STATUS_CHANGED',
        actorId: admin.id,
        before: { status: 'PENDING' },
        after: { status: 'PREPARING' },
      },
    ]);
  });

  it.each(['patch', 'cancel'] as const)(
    'cancelamento administrativo por %s gera somente ORDER_CANCELLED',
    async (route) => {
      const item = await order();
      const response =
        route === 'patch'
          ? await request(app)
              .patch(`/orders/${item.id}/status`)
              .set('Cookie', admin.cookie)
              .send({ status: 'CANCELLED' })
          : await request(app).post(`/orders/${item.id}/cancel`).set('Cookie', admin.cookie);
      expect(response.status).toBe(200);
      const logs = await events(item.id);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        action: 'ORDER_CANCELLED',
        before: { status: 'PENDING' },
        after: { status: 'CANCELLED' },
      });
      expect(
        (await request(app).post(`/orders/${item.id}/cancel`).set('Cookie', admin.cookie)).status,
      ).toBe(422);
      expect(await events(item.id)).toHaveLength(1);
    },
  );

  it('operação inválida e cancelamento do cliente não criam sucesso administrativo', async () => {
    const invalid = await order('READY');
    expect(
      (await request(app).post(`/orders/${invalid.id}/cancel`).set('Cookie', admin.cookie)).status,
    ).toBe(422);
    const own = await order();
    expect(
      (await request(app).post(`/orders/${own.id}/cancel`).set('Cookie', common.cookie)).status,
    ).toBe(200);
    expect(await events(invalid.id)).toHaveLength(0);
    expect(await events(own.id)).toHaveLength(0);
  });

  it('CAS concorrente mantém 409 e grava somente o evento vencedor', async () => {
    const item = await order();
    const outcomes = await Promise.allSettled(
      (['PREPARING', 'CANCELLED'] as const).map((next) =>
        OrderRepository.updateOrderStatus(item.id, 'PENDING', next, (tx) =>
          auditService.record(
            tx,
            { id: admin.id, admin: true },
            orderAuditEvent(item.id, 'PENDING', next),
          ),
        ),
      ),
    );
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const failure = outcomes.find((result) => result.status === 'rejected');
    expect(failure).toMatchObject({ status: 'rejected', reason: { status: 409 } });
    const logs = await events(item.id);
    const persisted = await prisma.order.findUniqueOrThrow({ where: { id: item.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]!.after).toEqual({ status: persisted.status });
  });

  it('exclusão concorrente registra um evento e mantém histórico após apagar produto', async () => {
    const item = await product();
    const results = await Promise.all(
      [0, 1].map(() =>
        request(app).delete(`/auth/products/${item.id}`).set('Cookie', admin.cookie),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 404]);
    const logs = await events(item.id);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'PRODUCT_DELETED',
      before: { name: item.name, price: item.price, category: item.category },
      after: null,
    });
  });

  it('falha real no INSERT de auditoria reverte criação, exclusão e status', async () => {
    const item = await order();
    const existing = await product();
    // DDL exclusivamente nesta instância descartável; não altera migrations ou runtime.
    await prisma.$executeRaw`CREATE FUNCTION rf45_reject_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'RF45_TEST_INSERT_FAILURE'; END; $$`;
    try {
      await prisma.$executeRaw`CREATE TRIGGER rf45_reject_audit BEFORE INSERT ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION rf45_reject_audit()`;
      const name = `Rollback ${randomUUID()}`;
      expect((await createProduct(name)).status).toBe(500);
      expect(await prisma.products.count({ where: { name } })).toBe(0);
      expect(
        (await request(app).delete(`/auth/products/${existing.id}`).set('Cookie', admin.cookie))
          .status,
      ).toBe(500);
      expect(await prisma.products.findUnique({ where: { id: existing.id } })).not.toBeNull();
      const response = await request(app)
        .patch(`/orders/${item.id}/status`)
        .set('Cookie', admin.cookie)
        .send({ status: 'PREPARING' });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Erro interno do servidor' });
      expect((await prisma.order.findUniqueOrThrow({ where: { id: item.id } })).status).toBe(
        'PENDING',
      );
      expect(await events(item.id)).toHaveLength(0);
      expect(await events(existing.id)).toHaveLength(0);
    } finally {
      await prisma.$executeRaw`DROP TRIGGER IF EXISTS rf45_reject_audit ON "AuditLog"`;
      await prisma.$executeRaw`DROP FUNCTION rf45_reject_audit()`;
    }
  });

  it('visitante recebe 401, usuário comum/conta rebaixada recebem 403 e no-store', async () => {
    for (const [cookie, status] of [
      [undefined, 401],
      [common.cookie, 403],
    ] as const) {
      const query = request(app).get(path);
      if (cookie) query.set('Cookie', cookie);
      const response = await query;
      expect(response.status).toBe(status);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.body.items).toBeUndefined();
    }
    const revoked = await account(true);
    await prisma.user.update({ where: { id: revoked.id }, data: { admin: false } });
    expect((await request(app).get(path).set('Cookie', revoked.cookie)).status).toBe(403);
  });

  it('ADMIN filtra e pagina deterministicamente com empate de data, sem PII', async () => {
    const ids = [randomUUID(), randomUUID(), randomUUID()].sort().reverse();
    await prisma.auditLog.createMany({
      data: ids.map((id) => ({
        id,
        actorId: admin.id,
        requestId: randomUUID(),
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: 'pagination-fixture',
        after: { name: 'Teste', category: 'HAMBURGUER', price: 100 },
        createdAt: new Date('2003-01-01T12:00:00Z'),
      })),
    });
    const filters = {
      actorId: admin.id,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: 'pagination-fixture',
      from: '2003-01-01T00:00:00Z',
      to: '2003-01-02T00:00:00Z',
      limit: 2,
    };
    const first = await request(app).get(path).query(filters).set('Cookie', admin.cookie);
    expect(first.status).toBe(200);
    expect(first.body.items.map((item: { id: string }) => item.id)).toEqual(ids.slice(0, 2));
    const second = await request(app)
      .get(path)
      .query({ ...filters, cursor: first.body.nextCursor })
      .set('Cookie', admin.cookie);
    expect(second.body.items.map((item: { id: string }) => item.id)).toEqual(ids.slice(2));
    expect(second.body.nextCursor).toBeNull();
    expect(Object.keys(second.body.items[0]).sort()).toEqual([
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
    expect(JSON.stringify(first.body)).not.toMatch(/password|email|cookie|gateway|customerName/);
    expect(
      (
        await request(app)
          .get(path)
          .query({ ...filters, action: 'ORDER_CANCELLED' })
          .set('Cookie', admin.cookie)
      ).body.items,
    ).toEqual([]);
    for (const invalid of [
      { limit: 101 },
      { cursor: 'malformed' },
      { action: 'PRODUCT_UPDATED' },
      { from: 'invalid' },
      { token: 'unexpected' },
    ])
      expect((await request(app).get(path).query(invalid).set('Cookie', admin.cookie)).status).toBe(
        400,
      );
    const id = first.body.items[0].id as string;
    expect(
      (
        await request(app)
          .patch(`${path}/${id}`)
          .set('Cookie', admin.cookie)
          .send({ action: 'PRODUCT_DELETED' })
      ).status,
    ).toBe(404);
    expect((await request(app).delete(`${path}/${id}`).set('Cookie', admin.cookie)).status).toBe(
      404,
    );
    expect(await prisma.auditLog.findUnique({ where: { id } })).not.toBeNull();
  });

  it('exclusão do administrador não apaga auditoria histórica', async () => {
    const reader = await account(true);
    const count = await prisma.auditLog.count({ where: { actorId: admin.id } });
    expect(count).toBeGreaterThan(0);
    await prisma.user.delete({ where: { id: admin.id } });
    expect((await request(app).get(path).set('Cookie', admin.cookie)).status).toBe(401);
    const response = await request(app)
      .get(path)
      .query({ actorId: admin.id })
      .set('Cookie', reader.cookie);
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(await prisma.auditLog.count({ where: { actorId: admin.id } })).toBe(count);
  });
});
