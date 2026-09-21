import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    pool: 'forks',
    // Todas as suites de integração usam o mesmo banco de teste. Quando arquivos
    // rodam em paralelo, um teste pode limpar/alterar registros que o outro ainda
    // está usando, causando falhas intermitentes e 404/422 em CI.
    fileParallelism: false,
    maxWorkers: 1,
    // minWorkers: 1,
    coverage: {
      provider: 'v8',
      exclude: ['src/database/migrations/**', 'src/**/*.d.ts'],
    },
  },
});
