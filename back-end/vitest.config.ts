import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    pool: 'forks',
    coverage: {
      provider: 'v8',
      exclude: ['src/database/migrations/**', 'src/**/*.d.ts'],
    },
  },
})
