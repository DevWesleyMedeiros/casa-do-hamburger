import { prisma } from '../../src/db.js';
import { getTestDatabaseUrl } from '../../src/shared/utils/testDatabaseSafety.js';

getTestDatabaseUrl();
try {
  const where = { email: { startsWith: 'rf44-', endsWith: '@example.invalid' } };
  const users = await prisma.user.findMany({ where, select: { id: true } });
  await prisma.order.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
  await prisma.user.deleteMany({ where });
} finally {
  await prisma.$disconnect();
}
