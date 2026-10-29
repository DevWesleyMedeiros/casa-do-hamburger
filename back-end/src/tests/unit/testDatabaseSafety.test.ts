import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateTestDatabase } from '../../shared/utils/testDatabaseSafety.js';

const connection =
  'postgresql://casa_security_20261028:fake@127.0.0.1:55432/casa_security_20261028';
const now = Date.parse('2026-10-28T12:00:00Z');
const authorization = {
  task: 'security-and-data-protection',
  disposable: true,
  connectionSha256: createHash('sha256').update(connection).digest('hex'),
  expiresAt: '2026-10-28T13:00:00Z',
};

describe('guarda anterior à conexão', () => {
  it('aceita somente o destino explícito com autorização válida', () => {
    expect(
      validateTestDatabase({ NODE_ENV: 'test', TEST_DATABASE_URL: connection }, authorization, now),
    ).toBe(connection);
  });
  it('não usa DATABASE_URL, mesmo com NODE_ENV=test', () => {
    expect(() =>
      validateTestDatabase({ NODE_ENV: 'test', DATABASE_URL: connection }, authorization, now),
    ).toThrow('TEST_DATABASE_UNSAFE');
  });
  it.each([
    connection.replace('127.0.0.1', 'production.example.com'),
    connection.replace('/casa_security_20261028', '/production_test'),
    `${connection}?host=production.example.com`,
    connection.replace('fake', 'different'),
  ])('rejeita destino não atestado sem revelar credenciais', (url) => {
    expect(() =>
      validateTestDatabase({ NODE_ENV: 'test', TEST_DATABASE_URL: url }, authorization, now),
    ).toThrow('TEST_DATABASE_UNSAFE');
  });
  it.each([
    { ...authorization, disposable: false },
    { ...authorization, expiresAt: '2026-10-27T12:00:00Z' },
    {},
  ])('rejeita autorização ausente, vencida ou não descartável', (approval) => {
    expect(() =>
      validateTestDatabase({ NODE_ENV: 'test', TEST_DATABASE_URL: connection }, approval, now),
    ).toThrow('TEST_DATABASE_UNSAFE');
  });
});
