import express from 'express';
import request from 'supertest';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { describe, expect, it } from 'vitest';
import { validateRuntimeEnvironment } from '../../config/runtimeEnvironment.js';
import { mutationOrigin } from '../../middlewares/mutationOrigin.js';
import { errorHandler } from '../../middlewares/errorHandler.js';
import { verifiedGoogleEmail } from '../../services/google/verifiedGoogleIdentity.js';
import { escapeHtml } from '../../shared/utils/escapeHtml.js';

const app = express();
app.use(mutationOrigin(['https://frontend.example']));
app.post('/logout', (_req, res) => res.sendStatus(204));
app.use(errorHandler);

describe('fronteiras de segurança', () => {
  it.each(['https://attacker.example', 'null', 'https://frontend.example.attacker.example'])(
    'bloqueia requisição mutável com Origin %s',
    async (origin) => {
      expect((await request(app).post('/logout').set('Origin', origin)).status).toBe(403);
    },
  );
  it('permite frontend cross-site autorizado e impede fallback cross-site sem Origin', async () => {
    expect(
      (
        await request(app)
          .post('/logout')
          .set('Origin', 'https://frontend.example')
          .set('Sec-Fetch-Site', 'cross-site')
      ).status,
    ).toBe(204);
    expect((await request(app).post('/logout').set('Sec-Fetch-Site', 'cross-site')).status).toBe(
      403,
    );
    expect(
      (await request(app).post('/logout').set('Referer', 'https://attacker.example/page')).status,
    ).toBe(403);
  });
  it('escapa texto e atributos HTML de e-mails', () => {
    expect(escapeHtml('<img src=x onerror="evil()"> & \'')).toBe(
      '&lt;img src=x onerror=&quot;evil()&quot;&gt; &amp; &#39;',
    );
  });
  it.each([
    { firebase: { sign_in_provider: 'password' }, email_verified: true },
    { firebase: { sign_in_provider: 'google.com' }, email_verified: false },
  ])('rejeita outro provedor Firebase ou e-mail não verificado', (claims) => {
    expect(() =>
      verifiedGoogleEmail({
        uid: 'uid',
        email: 'user@example.invalid',
        ...claims,
      } as DecodedIdToken),
    ).toThrow();
  });
  it('normaliza somente o e-mail de uma identidade Google verificada', () => {
    expect(
      verifiedGoogleEmail({
        uid: 'uid',
        email: 'User@example.invalid',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' },
      } as DecodedIdToken),
    ).toBe('user@example.invalid');
  });
  it('relata nomes de variáveis inválidas sem seus valores', () => {
    try {
      validateRuntimeEnvironment({
        JWT_SECRET: 'sentinel-secret',
        DATABASE_URL: 'sentinel-invalid',
      });
      throw new Error('deveria falhar');
    } catch (error) {
      expect((error as Error).message).toContain('JWT_SECRET');
      expect((error as Error).message).not.toContain('sentinel');
    }
  });
});
