import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname))
  throw new Error('E2E exige servidor local descartável');

export default defineConfig({
  globalTeardown: './e2e/teardown.ts',
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL,
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node node_modules/tsx/dist/cli.mjs tests/e2e/server.ts',
      cwd: '../back-end',
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'rf44-disposable-session-key-32-bytes-only',
        RESEND_API_KEY: 're_rf44_test_only',
        CLOUDINARY_CLOUD_NAME: 'rf44-test',
        CLOUDINARY_API_KEY: 'rf44-test',
        CLOUDINARY_API_SECRET: 'rf44-test',
      },
    },
    {
      command: 'node e2e/serve.mjs',
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NODE_ENV: 'production', VITE_API_URL: 'http://127.0.0.1:3000' },
    },
  ],
});
