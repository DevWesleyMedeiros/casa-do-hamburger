import { expect, it, vi } from 'vitest';

const { adapter, client } = vi.hoisted(() => ({ adapter: vi.fn(), client: vi.fn() }));
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: adapter }));
vi.mock('../../../generated/prisma/index.js', () => ({ PrismaClient: client }));
vi.mock('dotenv/config', () => ({}));
vi.mock('node:fs', () => ({
  readFileSync: () => {
    throw new Error('NO_AUTHORIZATION');
  },
}));

it('não constrói adapter nem Prisma Client quando falta autorização de banco descartável', async () => {
  await expect(import('../../db.js')).rejects.toThrow('TEST_DATABASE_UNSAFE');
  expect(adapter).not.toHaveBeenCalled();
  expect(client).not.toHaveBeenCalled();
});
