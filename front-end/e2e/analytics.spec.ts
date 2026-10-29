import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const fixtureKey = () =>
  createHash('sha256')
    .update(`${test.info().testId}-${test.info().retry}`)
    .digest('hex')
    .slice(0, 12);
test.beforeEach(async ({ context }) => {
  // Não depender de fontes/CDNs ou provedores externos; UI/API locais continuam reais.
  await context.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tests/e2e/seed.ts'], {
    cwd: resolve('../back-end'),
    env: { ...process.env, NODE_ENV: 'test', RF44_FIXTURE_KEY: fixtureKey() },
    stdio: 'pipe',
  });
});
async function login(page: Page, admin = true) {
  if (!page.url().endsWith('/login')) await page.goto('/login');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill(`rf44-${fixtureKey()}-${admin ? 'admin' : 'user'}@example.invalid`);
  await page.getByLabel('Senha', { exact: true }).fill('Rf44-test-only!123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText('Login realizado', { exact: true })).toBeHidden();
}
const total = (page: Page) => page.getByRole('article', { name: 'Total de pedidos', exact: true });
const value = (page: Page) =>
  page.getByRole('article', { name: 'Valor dos pedidos não cancelados', exact: true });

test('E2E-01 ADMIN vê KPIs e dados diários reais', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/admin/analytics/summary')) analyticsRequests.push(request.url());
  });
  await login(page);
  await page.getByRole('link', { name: 'Métricas' }).click();
  await expect(total(page)).toContainText('5');
  await expect(value(page)).toContainText(/100,00/);
  expect(analyticsRequests).toHaveLength(1);
  await page.getByText('Ver dados diários em tabela').click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
});
test('E2E-02 ADMIN altera período e consulta agrega novamente', async ({ page }) => {
  await login(page);
  await page.goto('/admin/analytics');
  await expect(total(page)).toContainText('5');
  await page.getByLabel('Período', { exact: true }).selectOption('30');
  await expect(total(page)).toContainText('6');
  await expect(value(page)).toContainText(/160,00/);
});
test('E2E-03 período personalizado vazio', async ({ page }) => {
  await login(page);
  await page.goto('/admin/analytics');
  await page.getByLabel('Período', { exact: true }).selectOption('custom');
  await page.getByLabel('Início inclusivo').fill('2001-01-01');
  await page.getByLabel('Fim exclusivo').fill('2001-01-03');
  await page.getByRole('button', { name: 'Aplicar período' }).click();
  await expect(page.getByText('Nenhum pedido neste período.', { exact: false })).toBeVisible();
  await expect(total(page)).toContainText('0');
});
test('E2E-04 usuário comum recebe negação na UI e API', async ({ page }) => {
  await login(page, false);
  await page.goto('/admin/analytics');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito aos administradores' }),
  ).toBeVisible();
  expect(
    (
      await page.request.get(
        'http://127.0.0.1:3000/admin/analytics/summary?from=2026-01-01&to=2026-01-02',
      )
    ).status(),
  ).toBe(403);
  await expect(total(page)).toHaveCount(0);
});
test('E2E-05 visitante retorna ao login e API exige sessão', async ({ page }) => {
  await page.goto('/admin/analytics');
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (
      await page.request.get(
        'http://127.0.0.1:3000/admin/analytics/summary?from=2026-01-01&to=2026-01-02',
      )
    ).status(),
  ).toBe(401);
});
test('E2E-06 cancelar pedido pela UI invalida dashboard ainda fresco', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Métricas' }).click();
  await expect(value(page)).toContainText(/100,00/);
  await page.getByRole('link', { name: 'Gerenciar pedidos' }).click();
  await page.getByLabel('Status do pedido').selectOption('CANCELLED');
  await expect(page.getByText('Pedido cancelado com sucesso')).toBeVisible();
  await expect(page.getByText('Pedido cancelado com sucesso')).toBeHidden();
  await page.getByRole('link', { name: 'Métricas' }).click();
  await expect(value(page)).toContainText(/90,00/);
  await expect(total(page)).toContainText('5');
});
test('E2E-07 logout e nova conta não veem dados administrativos', async ({ page }) => {
  await login(page);
  await page.goto('/admin/analytics');
  await expect(total(page)).toContainText('5');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, false);
  await page.goto('/admin/analytics');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito aos administradores' }),
  ).toBeVisible();
  await expect(total(page)).toHaveCount(0);
});
test('E2E-08 dashboard mobile sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole('button', { name: 'Abrir administração' }).click();
  await page.getByRole('link', { name: 'Métricas' }).click();
  await expect(total(page)).toContainText('5');
  await expect(page.getByRole('img', { name: /Quantidade de pedidos/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
});

test('E2E-09 perda da sessão remove métricas e retorna ao login', async ({ page, context }) => {
  await login(page);
  await page.getByRole('link', { name: 'Métricas' }).click();
  await expect(total(page)).toContainText('5');
  await context.clearCookies();
  await page.getByRole('button', { name: 'Atualizar dados' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(total(page)).toHaveCount(0);
});
