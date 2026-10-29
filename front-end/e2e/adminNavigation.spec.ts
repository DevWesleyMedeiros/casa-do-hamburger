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

for (const width of [360, 375, 390, 430, 767, 768, 1024, 1440]) {
  test(`admin navega e pedidos se adaptam em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    const openMenu = async () => {
      if (width < 768) await page.getByRole('button', { name: 'Abrir administração' }).click();
    };
    await openMenu();
    await page.getByRole('link', { name: 'Produtos', exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
    await openMenu();
    await page.getByRole('link', { name: 'Pedidos', exact: true }).click();
    await expect(page.getByText('Cliente RF44', { exact: true })).toBeVisible();
    await expect(page.getByText('Hambúrguer de teste (1)', { exact: true })).toBeVisible();
    await expect(page.getByText(/R\$\s*10,00/)).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `test-results/admin-orders-${width}.png`, fullPage: true });
    await openMenu();
    await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Adicionar Produto' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Adicionar Produto' })).toBeHidden();
    await openMenu();
    await page.getByRole('link', { name: 'Métricas', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/analytics$/);
    await expect(
      page.getByRole('article', { name: 'Total de pedidos', exact: true }),
    ).toContainText('5');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test('menu mobile fecha com Escape e clique externo e devolve foco', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page);
  const trigger = page.getByRole('button', { name: 'Abrir administração' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Administração', exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(5, 300);
  await expect(menu).toBeHidden();
});

test('cliente comum não recebe controles administrativos mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, false);
  await expect(page.getByRole('button', { name: 'Abrir administração' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Métricas' })).toHaveCount(0);
});
