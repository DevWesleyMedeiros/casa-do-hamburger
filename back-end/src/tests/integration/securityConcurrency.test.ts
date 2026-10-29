import './safety.js';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../generated/prisma/index.js';
import { prisma } from '../../db.js';
import { cartRepository } from '../../repositories/cart.repository.js';
import { OrderRepository } from '../../repositories/order.respository.js';
import { passwordResetTokenRepository } from '../../repositories/passwordResetToken.repository.js';
import { OrderServiceItems } from '../../services/orderServices/order.service.js';
import { passwordResetService } from '../../services/passwordReset.service.js';
import { hashResetToken } from '../../shared/utils/passwordResetToken.js';

const userIds: string[] = [];
const productIds: string[] = [];

async function seed() {
  const user = await prisma.user.create({
    data: {
      name: 'Security test',
      email: `${randomUUID()}@example.invalid`,
      password: 'old-hash',
      provider: 'LOCAL',
    },
  });
  userIds.push(user.id);
  return user;
}

async function seedCart() {
  const user = await seed();
  const product = await prisma.products.create({
    data: { name: 'Snapshot', description: 'Teste', price: 2500, category: 'Hamburgueres' },
  });
  productIds.push(product.id);
  const cart = await cartRepository.createCartItem(product.id, user.id);
  return { user, product, cart };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await prisma.payment.deleteMany({ where: { order: { userId: { in: userIds } } } });
  await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.cartItem.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.products.deleteMany({ where: { id: { in: productIds } } });
  userIds.length = 0;
  productIds.length = 0;
});

describe('concorrência real em PostgreSQL descartável', () => {
  it('consome um token uma única vez em redefinições simultâneas', async () => {
    const user = await seed();
    const raw = randomUUID();
    await passwordResetTokenRepository.replaceActiveToken({
      userId: user.id,
      tokenHash: hashResetToken(raw),
      expiresAt: new Date(Date.now() + 1800000),
    });
    const results = await Promise.all([
      passwordResetService.resetPassword(raw, 'SenhaNova123!'),
      passwordResetService.resetPassword(raw, 'OutraSenha123!'),
    ]);
    expect(results.sort()).toEqual(['invalid_token', 'ok']);
  });

  it('emissões concorrentes deixam somente o último token ativo', async () => {
    const user = await seed();
    await Promise.all(
      ['a', 'b'].map((raw) =>
        passwordResetTokenRepository.replaceActiveToken({
          userId: user.id,
          tokenHash: hashResetToken(raw),
          expiresAt: new Date(Date.now() + 1800000),
        }),
      ),
    );
    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id, usedAt: null },
    });
    expect(tokens).toHaveLength(1);
    const active = tokens[0]!.tokenHash;
    const old = active === hashResetToken('a') ? 'b' : 'a';
    expect(await passwordResetService.resetPassword(old, 'SenhaNova123!')).toBe('invalid_token');
  });

  it('falha parcial após consumir token reverte senha e usedAt na transação real', async () => {
    const user = await seed();
    const tokenHash = hashResetToken('rollback');
    await passwordResetTokenRepository.replaceActiveToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1800000),
    });
    const transaction = prisma.$transaction.bind(prisma);
    // Injeta falha na escrita da senha, mantendo o BEGIN/ROLLBACK do PostgreSQL real.
    const failingTransaction = (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      transaction(async (tx) => {
        vi.spyOn(tx.user, 'update').mockRejectedValueOnce(new Error('INJECTED_PASSWORD_FAILURE'));
        return operation(tx);
      });
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(
      failingTransaction as typeof prisma.$transaction,
    );
    await expect(
      passwordResetTokenRepository.consumeAndUpdatePassword(tokenHash, 'new-hash'),
    ).rejects.toThrow('INJECTED_PASSWORD_FAILURE');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).password).toBe(
      'old-hash',
    );
    expect(
      (await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } })).usedAt,
    ).toBeNull();
    expect(
      await passwordResetTokenRepository.consumeAndUpdatePassword(tokenHash, 'retry-hash'),
    ).toBe(true);
  });

  it('dois checkouts do mesmo carrinho criam somente um pedido/pagamento', async () => {
    const { user } = await seedCart();
    const results = await Promise.allSettled([
      OrderServiceItems.createOrder(user.id),
      OrderServiceItems.createOrder(user.id),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(1);
    expect(await prisma.payment.count({ where: { order: { userId: user.id } } })).toBe(1);
    expect(await prisma.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  it('adição concorrente é incluída no snapshot ou preservada no carrinho', async () => {
    const { user, product } = await seedCart();
    const [order] = await Promise.all([
      OrderServiceItems.createOrder(user.id),
      cartRepository.createCartItem(product.id, user.id),
    ]);
    const remaining = await prisma.cartItem.findMany({ where: { userId: user.id } });
    expect(
      order.items.reduce((sum, item) => sum + item.quantity, 0) +
        remaining.reduce((sum, item) => sum + item.quantity, 0),
    ).toBe(2);
    expect(order.total).toBe(
      order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
  });

  it('alteração de quantidade bem-sucedida não é apagada por checkout concorrente', async () => {
    const { user, cart } = await seedCart();
    const [checkout, update] = await Promise.allSettled([
      OrderServiceItems.createOrder(user.id),
      cartRepository.updateCartItemQuantity(cart.id, user.id, 7),
    ]);
    expect(checkout.status).toBe('fulfilled');
    if (checkout.status === 'fulfilled') {
      expect(checkout.value.items[0]!.quantity).toBe(update.status === 'fulfilled' ? 7 : 1);
    }
    expect(await prisma.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  it('falha ao limpar carrinho reverte pedido, itens e pagamento', async () => {
    const { user, cart } = await seedCart();
    const transaction = prisma.$transaction.bind(prisma);
    const failCleanup = (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      transaction(async (tx) => {
        vi.spyOn(tx.cartItem, 'deleteMany').mockRejectedValueOnce(
          new Error('INJECTED_CART_FAILURE'),
        );
        return operation(tx);
      });
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(
      failCleanup as typeof prisma.$transaction,
    );
    await expect(OrderServiceItems.createOrder(user.id)).rejects.toThrow('INJECTED_CART_FAILURE');
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.payment.count({ where: { order: { userId: user.id } } })).toBe(0);
    expect(await prisma.cartItem.findUnique({ where: { id: cart.id } })).not.toBeNull();
  });

  it('update/cancel concorrentes não sobrescrevem status com leitura obsoleta', async () => {
    const { user } = await seedCart();
    const order = await OrderServiceItems.createOrder(user.id);
    const find = OrderRepository.findOrderById.bind(OrderRepository);
    let arrived = 0;
    let release!: () => void;
    const bothRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(OrderRepository, 'findOrderById').mockImplementation(async (id) => {
      const snapshot = await find(id);
      arrived += 1;
      if (arrived === 2) release();
      await bothRead;
      return snapshot;
    });
    const results = await Promise.allSettled([
      OrderServiceItems.updateStatus(order.id, 'PREPARING', { id: user.id, admin: true }),
      OrderServiceItems.cancelOrder(order.id, { id: user.id, admin: false }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected).toMatchObject({ reason: { status: 409 } });
    const persisted = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    const winner = results.find((result) => result.status === 'fulfilled');
    if (winner?.status === 'fulfilled') expect(persisted.status).toBe(winner.value.status);
  });
});
