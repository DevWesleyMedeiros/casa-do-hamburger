import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { SignJWT } from 'jose';
import request from 'supertest';
import { Prisma } from '../../generated/prisma/index.js';
import { app } from '../../src/app.js';
import { getJwtSecret } from '../../src/config/jwt.js';
import { prisma } from '../../src/db.js';
import { analyticsAggregationQuery } from '../../src/repositories/adminAnalytics.repository.js';
import { getTestDatabaseUrl } from '../../src/shared/utils/testDatabaseSafety.js';

getTestDatabaseUrl();
const userId = randomUUID();
const period = { from: '2024-01-01', to: '2025-01-01' };
try {
  await prisma.user.create({
    data: {
      id: userId,
      name: 'Synthetic performance',
      email: `${userId}@example.invalid`,
      admin: true,
    },
  });
  await prisma.$executeRaw`
    INSERT INTO "Order" ("id", "userId", "customerName", "status", "total", "createdAt", "updatedAt")
    SELECT ${userId} || '-' || n, ${userId}, 'Synthetic',
      (ARRAY['PENDING','PREPARING','READY','DELIVERED','CANCELLED'])[1 + (n % 5)]::"OrderStatus",
      2500, timestamp '2024-01-01 12:00:00' + (n % 366) * interval '1 day', now()
    FROM generate_series(1, 50000) AS n
  `;
  await prisma.$executeRaw`ANALYZE "Order"`;
  const plan = await prisma.$queryRaw(
    Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${analyticsAggregationQuery(period)}`,
  );
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getJwtSecret());
  const elapsed: number[] = [];
  let bytes = 0;
  for (let i = 0; i < 12; i++) {
    const start = performance.now();
    const response = await request(app)
      .get('/admin/analytics/summary')
      .query(period)
      .set('Cookie', `user_section=${token}`);
    if (response.status !== 200 || response.body.orders.total !== 50000)
      throw new Error('Benchmark retornou dados inesperados');
    if (i >= 2) elapsed.push(performance.now() - start);
    bytes = Buffer.byteLength(response.text);
  }
  elapsed.sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        orders: 50000,
        days: 366,
        samples: elapsed.length,
        medianMs: elapsed[5],
        p95Ms: elapsed[9],
        dtoBytes: bytes,
        plan,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
}
