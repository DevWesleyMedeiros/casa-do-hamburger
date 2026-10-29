import './safety.js';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../db.js';
import { getJwtSecret } from '../../config/jwt.js';
import { uploadImageToCloudinary } from '../../services/uploads/cloudinary.service.js';
import type { toOrderDTO } from '../../dtos/order.dto.js';

const ids: string[] = [];
const products: string[] = [];
async function account(name: string, admin = false) {
  const user = await prisma.user.create({
    data: { name, email: `${randomUUID()}@example.invalid`, admin },
  });
  ids.push(user.id);
  const jwt = await new SignJWT({ id: user.id, admin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getJwtSecret());
  return { id: user.id, cookie: `user_section=${jwt}` };
}
afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.cartItem.deleteMany({ where: { userId: { in: ids } } });
  await prisma.products.deleteMany({ where: { id: { in: products } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

it('entrada em centavos → PostgreSQL → snapshots de duas contas → DTO → total/ticket agregados', async () => {
  const admin = await account('Administrador', true);
  const ana = await account('Ana Cliente');
  const bruno = await account('Bruno Cliente');
  vi.mocked(uploadImageToCloudinary).mockResolvedValue({
    url: 'https://example.invalid/image.png',
    key: 'synthetic',
    mimeType: 'image/png',
    size: 68,
  });
  const created = await request(app)
    .post('/auth/products')
    .set('Cookie', admin.cookie)
    .field('name', 'Hambúrguer original')
    .field('description', 'Descrição sintética do produto')
    .field('category', 'HAMBURGUER')
    .field('price', '2990')
    .attach(
      'image',
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0MsAAAAASUVORK5CYII=',
        'base64',
      ),
      'test.png',
    );
  expect(created.status).toBe(201);
  const productId = created.body.id as string;
  products.push(productId);
  expect(created.body.price).toBe(2990);
  expect((await prisma.products.findUniqueOrThrow({ where: { id: productId } })).price).toBe(2990);
  for (const [user, quantity] of [
    [ana, 2],
    [bruno, 1],
  ] as const) {
    await prisma.cartItem.create({ data: { userId: user.id, productId, quantity } });
    const checkout = await request(app).post('/orders').set('Cookie', user.cookie);
    expect(checkout.status).toBe(201);
    expect(checkout.body.total).toBe(2990 * quantity);
    expect(checkout.body.items[0]).toMatchObject({
      productName: 'Hambúrguer original',
      quantity,
      unitPrice: 2990,
      subtotal: 2990 * quantity,
    });
  }
  await prisma.products.update({
    where: { id: productId },
    data: { name: 'Catálogo alterado', price: 9999 },
  });
  await prisma.user.update({ where: { id: ana.id }, data: { name: 'Ana renomeada' } });
  const all = await request(app).get('/orders').set('Cookie', admin.cookie);
  expect(all.status).toBe(200);
  const selected = all.body.filter((o: ReturnType<typeof toOrderDTO>) =>
    ['Ana Cliente', 'Bruno Cliente'].includes(o.customerName),
  );
  expect(selected).toHaveLength(2);
  expect(selected.map((o: ReturnType<typeof toOrderDTO>) => o.customerName).sort()).toEqual([
    'Ana Cliente',
    'Bruno Cliente',
  ]);
  for (const order of selected) expect(order.items[0].productName).toBe('Hambúrguer original');
  for (const [user, name] of [
    [ana, 'Ana Cliente'],
    [bruno, 'Bruno Cliente'],
  ] as const) {
    const own = await request(app).get('/orders').set('Cookie', user.cookie);
    expect(own.body).toHaveLength(1);
    expect(own.body[0].customerName).toBe(name);
    const other = selected.find((o: ReturnType<typeof toOrderDTO>) => o.customerName !== name);
    expect((await request(app).get(`/orders/${other.id}`).set('Cookie', user.cookie)).status).toBe(
      404,
    );
    expect(JSON.stringify(own.body)).not.toMatch(/email|password|userId/);
  }
  // Intervalo exclusivo desta fixture; comparar API com o banco que alimenta a agregação.
  await prisma.order.updateMany({
    where: { userId: { in: [ana.id, bruno.id] } },
    data: { createdAt: new Date('2002-02-02T12:00:00Z') },
  });
  const summary = await request(app)
    .get('/admin/analytics/summary')
    .query({ from: '2002-02-02', to: '2002-02-03' })
    .set('Cookie', admin.cookie);
  expect(summary.status).toBe(200);
  expect(summary.body.orders.total).toBe(2);
  expect(summary.body.amounts).toEqual({ orderValueInCents: 8970, averageTicketInCents: 4485 });
});
