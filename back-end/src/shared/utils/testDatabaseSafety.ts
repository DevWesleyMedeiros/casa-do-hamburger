import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

const authorizationSchema = z.object({
  task: z.literal('security-and-data-protection'),
  disposable: z.literal(true),
  connectionSha256: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.iso.datetime(),
});

export function validateTestDatabase(
  environment: NodeJS.ProcessEnv,
  authorization: unknown,
  now = Date.now(),
): string {
  const fail = () => new Error('TEST_DATABASE_UNSAFE: banco descartável não autorizado');
  try {
    const approval = authorizationSchema.parse(authorization);
    const connection = environment['TEST_DATABASE_URL'];
    if (environment['NODE_ENV'] !== 'test' || !connection) throw fail();
    const url = new URL(connection);
    const expiresAt = Date.parse(approval.expiresAt);
    if (
      !['postgresql:', 'postgres:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.username !== 'casa_security_20261028' ||
      url.pathname !== '/casa_security_20261028' ||
      !url.port ||
      !url.password ||
      url.hash ||
      [...url.searchParams].some(([key, value]) => key !== 'schema' || value !== 'public') ||
      expiresAt <= now ||
      expiresAt > now + 24 * 60 * 60 * 1000 ||
      createHash('sha256').update(connection).digest('hex') !== approval.connectionSha256
    )
      throw fail();
    return connection;
  } catch {
    // Nunca inclui URL, conteúdo do arquivo ou erro de parsing (podem conter segredos).
    throw fail();
  }
}

export function getTestDatabaseUrl(): string {
  let authorization: unknown;
  try {
    // Arquivo local fornecido pelo mantenedor após verificar o destino descartável.
    authorization = JSON.parse(readFileSync('.test-database-authorization.json', 'utf8'));
  } catch {
    throw new Error('TEST_DATABASE_UNSAFE: autorização local de teste ausente ou inválida');
  }
  return validateTestDatabase(process.env, authorization);
}
