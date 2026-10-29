import cookieParser from 'cookie-parser';
import express from 'express';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuth } from '../../middlewares/authMiddlewares.js';
import { requiredAdmin } from '../../middlewares/requiredAdmin.js';
import { errorHandler } from '../../middlewares/errorHandler.js';
import { userRepository } from '../../repositories/user.repository.js';

vi.mock('../../repositories/user.repository.js', () => ({
  userRepository: { findSessionUser: vi.fn() },
}));
const secret = 'unit-test-key-with-at-least-32-bytes';
const app = express();
app.use(cookieParser());
app.get('/profile', requireAuth, (req, res) => res.json(req.user));
app.get('/admin', requireAuth, requiredAdmin, (_req, res) => res.sendStatus(204));
app.use(errorHandler);

async function token(payload: Record<string, unknown>, alg = 'HS256', expiration = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(secret));
}

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', secret);
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe('validade da identidade e dos privilégios por requisição', () => {
  it('rebaixa admin de JWT antigo conforme privilégio atual', async () => {
    vi.mocked(userRepository.findSessionUser).mockResolvedValue({
      id: 'user',
      admin: false,
      deletedAt: null,
    });
    const cookie = `user_section=${await token({ id: 'user', admin: true })}`;
    expect((await request(app).get('/admin').set('Cookie', cookie)).status).toBe(403);
    expect((await request(app).get('/profile').set('Cookie', cookie)).body).toEqual({
      id: 'user',
      admin: false,
    });
  });
  it.each([null, { id: 'user', admin: true, deletedAt: new Date() }])(
    'rejeita conta inexistente ou desativada',
    async (user) => {
      vi.mocked(userRepository.findSessionUser).mockResolvedValue(user);
      expect(
        (
          await request(app)
            .get('/profile')
            .set('Cookie', `user_section=${await token({ id: 'user', admin: true })}`)
        ).status,
      ).toBe(401);
    },
  );
  it('não usa claims de perfil ou admin sem buscar a conta', async () => {
    const response = await request(app)
      .get('/profile')
      .set('Cookie', `user_section=${await token({ id: 42, admin: true })}`);
    expect(response.status).toBe(401);
    expect(userRepository.findSessionUser).not.toHaveBeenCalled();
  });
  it.each([
    ['HS384', '7d'],
    ['HS256', '-1s'],
  ])('rejeita algoritmo inesperado ou expiração (%s/%s)', async (alg, expiration) => {
    expect(
      (
        await request(app)
          .get('/profile')
          .set('Cookie', `user_section=${await token({ id: 'user' }, alg, expiration)}`)
      ).status,
    ).toBe(401);
    expect(userRepository.findSessionUser).not.toHaveBeenCalled();
  });
});
