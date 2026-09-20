// Arquivo NOVO — backend/src/tests/integration/order.test.ts
//
// Segue o mesmo padrão de loginLimiter.test.ts/passwordReset.test.ts:
// app real (app.ts) + Supertest + Prisma real de teste (DATABASE_URL de
// teste — nunca o banco de desenvolvimento).

import { fakerPT_BR as faker, type Faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../db.js';
import {
  loginLimiterBroadStore,
  loginLimiterTargetedStore,
  registerLimiterBroadStore,
  registerLimiterTargetedStore,
} from '../../middlewares/rateLimiter.js';

async function createAuthedUser(admin = false) {
  const fake: Faker = faker;
  const email = fake.internet.email();
  const password = 'SenhaForte123!';
  // CEP FIXO válido que sempre passa na validação do schema (formato 00000-000)
  const cep = '01001-000';

  // Registra usuário com CEP (campo obrigatório no register do controller)
  const registerRes = await request(app).post('/auth/register').send({
    name: fake.person.fullName(),
    email,
    password,
    confirmPassword: password,
    cep,
  });

  // Verifica se registro deu certo antes de tentar logar
  if (registerRes.statusCode !== 201) {
    console.error(`[TEST] Registro falhou! Status: ${registerRes.status}, Body:`, registerRes.body);
    throw new Error(`Registro falhou com status ${registerRes.status}`);
  }

  if (admin) {
    await prisma.user.update({ where: { email }, data: { admin: true } });
  }

  const loginRes = await request(app).post('/auth/login').send({ email, password });
  // Junta múltiplos set-cookie em uma única string para o cabeçalho Cookie
  const setCookie = loginRes.headers['set-cookie'];
  if (!setCookie) {
    console.error(`[TEST] Login falhou! Status: ${loginRes.status}, Body:`, loginRes.body);
    throw new Error(`Login falhou com status ${loginRes.status} — cookie não definido`);
  }
  const cookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;

  return { email, cookie };
}
async function seedProductAndCartItem(userCookie: string | undefined) {
  if (!userCookie) throw new Error('Cookie de autenticação inválido — login falhou');

  const product = await prisma.products.create({
    data: { name: 'X-Burguer', description: 'Clássico', price: 2500, category: 'Hamburgueres' },
  });

  await request(app)
    .post('/cart-item')
    .set('Cookie', userCookie)
    .send({ productId: product.id, quantity: 2 });

  return product;
}

describe('Order — checkout, IDOR e máquina de estados (RF-32 a 40)', () => {
  beforeEach(() => {
    // Garante reset completo do rate limiter antes de cada teste
    loginLimiterBroadStore.resetAll();
    loginLimiterTargetedStore.resetAll();
    registerLimiterBroadStore.resetAll();
    registerLimiterTargetedStore.resetAll();
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.products.deleteMany();
    await prisma.user.deleteMany();
  });

  it('cria um pedido a partir do carrinho, com snapshot e total recalculado no backend (RN-ORDER-01/04, RN-CART-06)', async () => {
    const { cookie } = await createAuthedUser();
    await seedProductAndCartItem(cookie);

    const res = await request(app).post('/orders').set('Cookie', cookie).send({ total: 1 }); // valor forjado pelo cliente — deve ser ignorado

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.total).toBe(5000); // 2500 * 2, nunca o "1" enviado
    expect(res.body.items[0].productName).toBe('X-Burguer'); // snapshot, RN-ORDER-01
    expect(res.body.payment.status).toBe('SIMULATED');
  });

  it('esvazia o carrinho após criar o pedido', async () => {
    const { cookie } = await createAuthedUser();
    await seedProductAndCartItem(cookie);
    await request(app).post('/orders').set('Cookie', cookie);
    const cartRes = await request(app).get('/get-cart-items').set('Cookie', cookie);
    expect(cartRes.body).toBe([]);
  });

  it('rejeita checkout com carrinho vazio', async () => {
    const { cookie } = await createAuthedUser();
    const res = await request(app).post('/orders').set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  it('RN-ORDER-06 — impede que um usuário veja o pedido de outro (IDOR/OWASP A01)', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);
    const orderId = orderRes.body.id;

    const stranger = await createAuthedUser();
    const res = await request(app).get(`/orders/${orderId}`).set('Cookie', stranger.cookie);

    expect(res.status).toBe(404); // 404, não 403 — não confirma existência do recurso
  });

  it('admin consegue ver o pedido de qualquer usuário', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);

    const admin = await createAuthedUser(true);
    const res = await request(app).get(`/orders/${orderRes.body.id}`).set('Cookie', admin.cookie);

    expect(res.status).toBe(200);
  });

  it('RN-ORDER-05 — rejeita transição de status inválida com 422', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);

    const admin = await createAuthedUser(true);
    const res = await request(app)
      .patch(`/orders/${orderRes.body.id}/status`)
      .set('Cookie', admin.cookie)
      .send({ status: 'DELIVERED' }); // PENDING → DELIVERED não é permitido

    expect(res.status).toBe(422);
  });

  it('usuário comum não pode alterar status de pedido (admin-only)', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);

    const res = await request(app)
      .patch(`/orders/${orderRes.body.id}/status`)
      .set('Cookie', owner.cookie)
      .send({ status: 'PREPARING' });

    expect(res.status).toBe(403);
  });

  it('RF-40 — cliente pode cancelar o próprio pedido apenas em PENDING', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);

    const res = await request(app)
      .post(`/orders/${orderRes.body.id}/cancel`)
      .set('Cookie', owner.cookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('RF-40 — cliente NÃO pode cancelar um pedido já em preparo', async () => {
    const owner = await createAuthedUser();
    await seedProductAndCartItem(owner.cookie);
    const orderRes = await request(app).post('/orders').set('Cookie', owner.cookie);

    const admin = await createAuthedUser(true);
    await request(app)
      .patch(`/orders/${orderRes.body.id}/status`)
      .set('Cookie', admin.cookie)
      .send({ status: 'PREPARING' });

    const res = await request(app)
      .post(`/orders/${orderRes.body.id}/cancel`)
      .set('Cookie', owner.cookie);

    expect(res.status).toBe(422);
  });
});
