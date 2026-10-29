import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt-ts';
import { prisma } from '../../src/db.js';
import { getTestDatabaseUrl } from '../../src/shared/utils/testDatabaseSafety.js';
import type { OrderStatus, User } from '../../generated/prisma/index.js';

getTestDatabaseUrl();
const fixtureKey = process.env['RF44_FIXTURE_KEY'] ?? '000000000000';
if (!/^[a-f0-9]{12}$/.test(fixtureKey)) throw new Error('Chave de fixture inválida');
const emails = [
  `rf44-${fixtureKey}-admin@example.invalid`,
  `rf44-${fixtureKey}-user@example.invalid`,
];
try {
  const old = await prisma.user.findMany({
    where: { email: { startsWith: 'rf44-', endsWith: '@example.invalid' } },
    select: { id: true },
  });
  await prisma.order.deleteMany({ where: { userId: { in: old.map((user) => user.id) } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: old.map((user) => user.id) } } });
  await prisma.cartItem.deleteMany({ where: { userId: { in: old.map((user) => user.id) } } });
  await prisma.products.deleteMany({ where: { name: { startsWith: 'RF45 fixture produto' } } });
  await prisma.user.deleteMany({ where: { id: { in: old.map((user) => user.id) } } });
  const password = await hash('Rf44-test-only!123', 10);
  const users: User[] = [];
  for (const [index, email] of emails.entries()) {
    users.push(
      await prisma.user.upsert({
        where: { email },
        update: { password, admin: index === 0, deletedAt: null },
        create: {
          email,
          name: index === 0 ? 'Admin RF44' : 'Cliente RF44',
          password,
          admin: index === 0,
          emailVerified: true,
        },
      }),
    );
  }
  const userIds = users.map((user) => user.id);
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  if (process.env['RF45_AUDIT_FIXTURES'] === '1') {
    await prisma.auditLog.createMany({
      data: Array.from({ length: 21 }, (_, index) => ({
        id: randomUUID(),
        actorId: users[0]!.id,
        requestId: randomUUID(),
        action: 'PRODUCT_DELETED',
        entityType: 'PRODUCT',
        entityId: `rf45-page-${index}`,
        before: { name: `RF45 removido ${index}`, category: 'HAMBURGUER', price: 100 },
        createdAt: new Date(Date.parse('2005-01-01T12:00:00Z') + index),
      })),
    });
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  );
  const anchor = Date.parse(`${today}T12:00:00Z`);
  const statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  for (const [index, status] of statuses.entries()) {
    await prisma.order.create({
      data: {
        id: `rf44-order-${index}`,
        userId: users[1]!.id,
        customerName: 'Cliente RF44',
        status,
        total: (index + 1) * 1000,
        createdAt: new Date(anchor - index * 86_400_000),
        items: {
          create: {
            productName: 'Hambúrguer de teste',
            unitPrice: (index + 1) * 1000,
            quantity: 1,
            subtotal: (index + 1) * 1000,
          },
        },
        payment: { create: { status: 'SIMULATED' } },
      },
    });
  }
  await prisma.order.create({
    data: {
      id: 'rf44-order-old',
      userId: users[1]!.id,
      customerName: 'Cliente RF44',
      total: 6000,
      status: 'DELIVERED',
      createdAt: new Date(anchor - 15 * 86_400_000),
    },
  });
} finally {
  await prisma.$disconnect();
}
