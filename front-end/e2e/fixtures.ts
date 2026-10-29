import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Origem sintética por cenário, em sub-redes IPv6 /56 distintas do proxy local. */
export function clientAddress(key: string): string {
  const address = `fd${createHash('sha256').update(key).digest('hex').slice(0, 14)}`;
  return `${address.slice(0, 4)}:${address.slice(4, 8)}:${address.slice(8, 12)}:${address.slice(12, 16)}::1`;
}

export const test = base.extend<{ auditFixtures: boolean }>({
  auditFixtures: [false, { option: true }],
  // O app confia em um proxy. Cada cenário representa um cliente independente,
  // sem compartilhar a cota de 20 logins/15min com os demais cenários e retries.
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
    await use({
      ...extraHTTPHeaders,
      'X-Forwarded-For': clientAddress(`${testInfo.testId}-${testInfo.retry}`),
    });
  },
});
export { expect };

const fixtureKey = () =>
  createHash('sha256')
    .update(`${test.info().testId}-${test.info().retry}`)
    .digest('hex')
    .slice(0, 12);

test.beforeEach(async ({ context, auditFixtures }) => {
  await context.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tests/e2e/seed.ts'], {
    cwd: resolve('../back-end'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      RF44_FIXTURE_KEY: fixtureKey(),
      RF45_AUDIT_FIXTURES: auditFixtures ? '1' : '0',
    },
    stdio: 'pipe',
  });
});

export const fixtureEmail = (admin = true): string =>
  `rf44-${fixtureKey()}-${admin ? 'admin' : 'user'}@example.invalid`;

export async function login(page: Page, admin = true): Promise<void> {
  if (!page.url().endsWith('/login')) await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(fixtureEmail(admin));
  await page.getByLabel('Senha', { exact: true }).fill('Rf44-test-only!123');
  const [response] = await Promise.all([
    page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === '/auth/login' && result.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Entrar', exact: true }).click(),
  ]);
  expect(response.status(), 'POST /auth/login deve responder 200 antes da navegação').toBe(200);
  // Asserção booleana: nunca incluir o valor do cookie/JWT nos logs de falha.
  await expect
    .poll(
      async () =>
        (await page.context().cookies(response.url())).some(
          (cookie) => cookie.name === 'user_section' && cookie.httpOnly && cookie.value.length > 0,
        ),
      { message: 'Login deve estabelecer a sessão httpOnly user_section' },
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('Login realizado', { exact: true })).toBeHidden();
}
