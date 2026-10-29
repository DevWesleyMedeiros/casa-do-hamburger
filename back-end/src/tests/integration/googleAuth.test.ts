import './safety.js';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt-ts';
import type { DecodedIdToken } from 'firebase-admin/auth';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock do Firebase Admin — nunca bate na rede de verdade em teste.
// Cada `it` controla o que verifyFirebaseIdToken resolve/rejeita, simulando exatamente as decisões de RN-AUTH-08/09/11 sem depender do Google.

/**
 * Fábrica de um payload decodificado de ID Token do Firebase (mock).
 * Simula o retorno de admin.auth().verifyIdToken() após o front enviar o idToken obtido no login com GoogleAuthProvider.
 *
 * Use `overrides` para forçar cenários de borda em cada teste,
 * ex.: { email_verified: false } para validar o gate da RN-AUTH-11.
 */

// mock precisa vir ANTES do import de app.js — Vitest faz hoisting automático de vi.mock() para o topo do arquivo, mas deixe explícito por clareza
vi.mock('../../config/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

// 2. IMPORTS EXECUTADOS SEQUENCIALMENTE APÓS O MOCK ESTAR SETUPADO
import { app } from '../../app.js';
import { verifyFirebaseIdToken } from '../../config/firebaseAdmin.js';
import { prisma } from '../../db.js';

const verifyFirebaseIdTokenMock = vi.mocked(verifyFirebaseIdToken);

describe('Google Auth Integration', () => {
  describe('POST /auth/google (Login social — RF-51 a RF-55)', () => {
    const cleanupUsers = async () => {
      await prisma.cartItem.deleteMany();
      await prisma.orderItem.deleteMany();
      await prisma.order.deleteMany();
      await prisma.emailVerificationToken.deleteMany();
      await prisma.passwordResetToken.deleteMany();
      await prisma.user.deleteMany();
    };

    beforeEach(async () => {
      await cleanupUsers();
      vi.clearAllMocks();
    });

    afterEach(async () => {
      await cleanupUsers();
    });

    const fakeDecodedToken = (overrides: Partial<DecodedIdToken> = {}) => ({
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
      name: faker.person.fullName(),
      picture: faker.image.avatar(),
      firebase: { sign_in_provider: 'google.com', identities: {} },
      iss: 'https://securetoken.google.com/casa-do-hamburguer',
      aud: 'casa-do-hamburguer',
      sub: faker.string.uuid(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    });

    it('deve criar um novo usuário provider=GOOGLE quando o e-mail não existe (RF-53)', async () => {
      const decoded = fakeDecodedToken();
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded); // função que vai retornar o decoded token simulando um Firebase ID Token válido

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(decoded.email);
      expect(response.body.user.password).toBeUndefined();

      const created = await prisma.user.findUnique({ where: { email: decoded.email } });
      expect(created?.provider).toBe('GOOGLE');
      expect(created?.password).toBeNull();
      expect(created?.firebaseUid).toBe(decoded.uid);

      const setCookie = response.headers['set-cookie']?.[0] ?? '';
      expect(setCookie).toContain('user_section=');
      expect(setCookie.toLowerCase()).toContain('httponly');
    });

    it('deve vincular automaticamente a uma conta LOCAL existente quando email_verified=true (RF-54)', async () => {
      const userEmail = faker.internet.email();
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('SenhaAntiga123!', 10),
          provider: 'LOCAL',
          cep: '00000-000',
        },
      });
      const decoded = fakeDecodedToken({ email: userEmail, email_verified: true });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' });

      expect(response.status).toBe(200);
      const linked = await prisma.user.findUnique({ where: { email: userEmail } });
      expect(linked?.firebaseUid).toBe(decoded.uid);
      expect(linked?.provider).toBe('LOCAL');
      expect(linked?.password).not.toBeNull();
    });

    it('NÃO deve vincular automaticamente quando email_verified=false (RN-AUTH-11 — segurança)', async () => {
      const userEmail = faker.internet.email();
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: userEmail,
          password: await bcrypt.hash('SenhaAntiga123!', 10),
          provider: 'LOCAL',
          cep: '00000-000',
        },
      });
      const decoded = fakeDecodedToken({ email: userEmail, email_verified: false });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);

      const response = await request(app).post('/auth/google').send({ idToken: 'token-valido' });

      expect(response.status).toBe(409);
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { email: userEmail } })).firebaseUid,
      ).toBeNull();
    });

    it('não aceita identidade Firebase autenticada por outro provedor', async () => {
      const decoded = fakeDecodedToken({
        firebase: { sign_in_provider: 'password', identities: {} },
      });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);
      const response = await request(app).post('/auth/google').send({ idToken: 'other-provider' });
      expect(response.status).toBe(401);
      expect(await prisma.user.findUnique({ where: { email: decoded.email } })).toBeNull();
    });

    it('não cria conta com e-mail não verificado', async () => {
      const decoded = fakeDecodedToken({ email_verified: false });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);
      expect((await request(app).post('/auth/google').send({ idToken: 'unverified' })).status).toBe(
        409,
      );
      expect(await prisma.user.findUnique({ where: { email: decoded.email } })).toBeNull();
    });

    it('não substitui uma identidade já vinculada por outro UID do mesmo e-mail', async () => {
      const existing = await prisma.user.create({
        data: {
          name: 'Linked',
          email: faker.internet.email(),
          provider: 'GOOGLE',
          firebaseUid: faker.string.uuid(),
        },
      });
      const decoded = fakeDecodedToken({ email: existing.email });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);
      expect(
        (await request(app).post('/auth/google').send({ idToken: 'different-uid' })).status,
      ).toBe(409);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).firebaseUid,
      ).toBe(existing.firebaseUid);
    });

    it('conta desativada não recebe sessão via UID conhecido', async () => {
      const decoded = fakeDecodedToken();
      await prisma.user.create({
        data: {
          name: 'Disabled',
          email: decoded.email,
          firebaseUid: decoded.uid,
          provider: 'GOOGLE',
          deletedAt: new Date(),
        },
      });
      verifyFirebaseIdTokenMock.mockResolvedValue(decoded);
      const response = await request(app).post('/auth/google').send({ idToken: 'disabled' });
      expect(response.status).toBe(401);
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('vínculos concorrentes de UIDs distintos não sobrescrevem a identidade vencedora', async () => {
      const existing = await prisma.user.create({
        data: {
          name: 'Local',
          email: faker.internet.email(),
          provider: 'LOCAL',
          password: await bcrypt.hash('SenhaLocal123!', 10),
        },
      });
      const first = fakeDecodedToken({ email: existing.email });
      const second = fakeDecodedToken({ email: existing.email });
      verifyFirebaseIdTokenMock.mockImplementation(async (token) =>
        token === 'first' ? first : second,
      );
      const responses = await Promise.all(
        ['first', 'second'].map((idToken) => request(app).post('/auth/google').send({ idToken })),
      );
      expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
      const winner = responses[0]!.status === 200 ? first.uid : second.uid;
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).firebaseUid,
      ).toBe(winner);
    });
  });
});
