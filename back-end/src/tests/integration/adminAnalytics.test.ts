import './safety.js';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { getJwtSecret } from '../../config/jwt.js';
import { prisma } from '../../db.js';
import type { AdminAnalyticsDTO } from '../../dtos/adminAnalytics.dto.js';

const ids: string[] = [];
let adminCookie: string;
let commonCookie: string;
let orderId: string;
const path = '/admin/analytics/summary';
const period = { from: '2026-01-01', to: '2026-01-04' };

async function account(admin: boolean): Promise<string> {
  const user = await prisma.user.create({
    data: { name: 'Analytics fixture', email: `${randomUUID()}@example.invalid`, admin },
  });
  ids.push(user.id);
  const token = await new SignJWT({ id: user.id, admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getJwtSecret());
  return `user_section=${token}`;
}

beforeAll(async () => {
  adminCookie = await account(true);
  commonCookie = await account(false);
  const dates = [
    '2026-01-01T02:59:59.999Z',
    '2026-01-01T03:00:00.000Z',
    '2026-01-02T02:59:59.999Z',
    '2026-01-02T03:00:00.000Z',
    '2026-01-04T02:59:59.999Z',
    '2026-01-04T03:00:00.000Z',
  ];
  for (const [index, date] of dates.entries()) {
    const order = await prisma.order.create({
      data: {
        userId: ids[0]!,
        customerName: 'PII must not leak',
        total: 1001,
        status: index === 2 ? 'CANCELLED' : 'PENDING',
        createdAt: new Date(date),
        deletedAt: index === 3 ? new Date() : null,
      },
    });
    if (index === 1) orderId = order.id;
  }
});
afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe('RF-44 API real em PostgreSQL descartável', () => {
  it('exige sessão e privilégio atual, mesmo com admin=true no JWT', async () => {
    expect((await request(app).get(path).query(period)).status).toBe(401);
    expect(
      (await request(app).get(path).query(period).set('Cookie', 'user_section=invalid')).status,
    ).toBe(401);
    expect((await request(app).get(path).query(period).set('Cookie', commonCookie)).status).toBe(
      403,
    );
  });
  it('agrega em centavos, respeita fronteiras do fuso e inclui histórico sem PII', async () => {
    const response = await request(app).get(path).query(period).set('Cookie', adminCookie);
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    const dto = response.body as AdminAnalyticsDTO;
    expect(dto.orders).toEqual({
      total: 4,
      nonCancelled: 3,
      byStatus: { PENDING: 3, CANCELLED: 1, PREPARING: 0, READY: 0, DELIVERED: 0 },
    });
    expect(dto.amounts).toEqual({ orderValueInCents: 3003, averageTicketInCents: 1001 });
    expect(dto.series).toEqual([
      { date: '2026-01-01', orders: 2, orderValueInCents: 1001 },
      { date: '2026-01-02', orders: 1, orderValueInCents: 1001 },
      { date: '2026-01-03', orders: 1, orderValueInCents: 1001 },
    ]);
    expect(JSON.stringify(dto)).not.toMatch(/PII|email|customerName|userId|password|token|items/);
  });
  it('retorna zeros em período vazio e rejeita datas/limites inválidos', async () => {
    const empty = await request(app)
      .get(path)
      .query({ from: '2001-01-01', to: '2001-01-03' })
      .set('Cookie', adminCookie);
    expect(empty.status).toBe(200);
    expect(empty.body.orders.total).toBe(0);
    expect(empty.body.amounts.averageTicketInCents).toBe(0);
    expect(empty.body.series).toHaveLength(2);
    for (const filters of [
      { from: 'bad', to: period.to },
      { from: period.to, to: period.from },
      { from: '2024-01-01', to: '2026-01-01' },
      { from: '2026-02-30', to: '2026-03-01' },
    ]) {
      expect((await request(app).get(path).query(filters).set('Cookie', adminCookie)).status).toBe(
        400,
      );
    }
  });
  it('consulta posterior reflete cancelamento sem alterar contagem por criação', async () => {
    const update = await request(app).post(`/orders/${orderId}/cancel`).set('Cookie', adminCookie);
    expect(update.status).toBe(200);
    const response = await request(app).get(path).query(period).set('Cookie', adminCookie);
    expect(response.body.orders.total).toBe(4);
    expect(response.body.orders.byStatus.CANCELLED).toBe(2);
    expect(response.body.amounts.orderValueInCents).toBe(2002);
  });
  it('rejeita JWT expirado e não revela dados administrativos', async () => {
    const token = await new SignJWT({ id: ids[0]!, admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(getJwtSecret());
    const response = await request(app)
      .get(path)
      .query(period)
      .set('Cookie', `user_section=${token}`);
    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty('orders');
  });
  it('agrega os cinco status e pagamentos simulados sem tratá-los como receita', async () => {
    const statuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] as const;
    for (const [index, status] of statuses.entries()) {
      await prisma.order.create({
        data: {
          userId: ids[0]!,
          customerName: 'Synthetic',
          total: (index + 1) * 101,
          status,
          createdAt: new Date('2019-06-01T12:00:00Z'),
          payment: { create: { status: 'SIMULATED' } },
        },
      });
    }
    const response = await request(app)
      .get(path)
      .query({ from: '2019-06-01', to: '2019-06-02' })
      .set('Cookie', adminCookie);
    expect(response.status).toBe(200);
    expect(response.body.orders).toEqual({
      total: 5,
      nonCancelled: 4,
      byStatus: { PENDING: 1, PREPARING: 1, READY: 1, DELIVERED: 1, CANCELLED: 1 },
    });
    expect(response.body.amounts).toEqual({ orderValueInCents: 1010, averageTicketInCents: 253 });
    expect(response.body).not.toHaveProperty('revenue');
  });
  it('aplica horário de verão histórico do timezone IANA', async () => {
    await prisma.order.createMany({
      data: ['2018-01-01T01:59:59Z', '2018-01-01T02:00:00Z', '2018-01-02T02:00:00Z'].map(
        (date) => ({ userId: ids[0]!, customerName: 'DST', total: 100, createdAt: new Date(date) }),
      ),
    });
    const response = await request(app)
      .get(path)
      .query({ from: '2018-01-01', to: '2018-01-02' })
      .set('Cookie', adminCookie);
    expect(response.status).toBe(200);
    expect(response.body.orders.total).toBe(1);
    expect(response.body.series[0].date).toBe('2018-01-01');
  });
});
