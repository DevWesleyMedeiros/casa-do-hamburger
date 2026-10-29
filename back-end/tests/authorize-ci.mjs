import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Somente para o serviço PostgreSQL efêmero do job GitHub Actions.
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.NODE_ENV !== 'test') {
  throw new Error('Autorização automática restrita ao PostgreSQL descartável do CI');
}
const connection = process.env.TEST_DATABASE_URL;
if (!connection || connection !== process.env.DATABASE_URL)
  throw new Error('Conexão de CI inconsistente');
const { validateTestDatabase } = await import('../src/shared/utils/testDatabaseSafety.ts');
const authorization = {
  task: 'security-and-data-protection',
  disposable: true,
  connectionSha256: createHash('sha256').update(connection).digest('hex'),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};
validateTestDatabase(process.env, authorization);
writeFileSync('.test-database-authorization.json', JSON.stringify(authorization), {
  flag: 'wx',
  mode: 0o600,
});
