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
    env: {
      ...process.env,
      NODE_ENV: 'test',
      RF44_FIXTURE_KEY: fixtureKey(),
      RF45_AUDIT_FIXTURES: '1',
    },
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

const list = (page: Page) => page.getByRole('list', { name: 'Eventos de auditoria' });
async function chooseAction(page: Page, action: string) {
  await page.getByLabel('Tipo da ação').selectOption(action);
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
}

test('ADMIN cria produto com preço em reais e consulta evento persistido', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Adicionar Produto' });
  await dialog.getByLabel('Nome do Produto').fill('RF45 fixture produto novo');
  await dialog.getByLabel('Descrição', { exact: true }).fill('Descrição sintética do produto');
  await dialog.getByLabel('Categoria', { exact: true }).selectOption('HAMBURGUER');
  await dialog.getByLabel('Preço', { exact: true }).fill('29,90');
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0MsAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await dialog.getByRole('button', { name: 'Adicionar Produto', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await chooseAction(page, 'PRODUCT_CREATED');
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await expect(list(page)).toContainText('RF45 fixture produto novo');
  await expect(list(page)).toContainText(/29,90/);
  await expect(page.getByRole('heading', { name: 'Produto criado', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/rf45-audit-desktop.png', fullPage: true });
});

test('transição e cancelamento pela UI aparecem na auditoria com estados anteriores', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: 'Pedidos', exact: true }).click();
  await page.getByLabel('Status do pedido').selectOption('PREPARING');
  await expect(page.getByText('Status atualizado com sucesso', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await chooseAction(page, 'ORDER_STATUS_CHANGED');
  await expect(list(page)).toContainText('Pendente → Em preparo');
  await page.getByRole('link', { name: 'Pedidos', exact: true }).click();
  await page.getByRole('button', { name: 'Preparando', exact: true }).click();
  await page.getByLabel('Status do pedido').first().selectOption('CANCELLED');
  await expect(page.getByText('Pedido cancelado com sucesso', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await chooseAction(page, 'ORDER_CANCELLED');
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await expect(list(page)).toContainText('Em preparo → Cancelado');
});

test('filtros e paginação consultam dados reais e apresentam vazio', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(20);
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Página 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Página anterior' }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(20);
  await page.getByLabel('Início inclusivo (UTC)').fill('2005-01-01');
  await page.getByLabel('Fim exclusivo (UTC)').fill('2005-01-02');
  await page.getByLabel('Entidade', { exact: true }).selectOption('PRODUCT');
  await chooseAction(page, 'PRODUCT_DELETED');
  await expect(list(page).getByRole('listitem')).toHaveCount(20);
  await chooseAction(page, 'ORDER_CANCELLED');
  await expect(page.getByText('Nenhum evento encontrado.')).toBeVisible();
});

test('usuário comum e visitante não consultam auditoria', async ({ page }) => {
  const apiUrl = 'http://127.0.0.1:3000/admin/audit-logs';
  expect((await page.request.get(apiUrl)).status()).toBe(401);
  await page.goto('/admin/audit-logs');
  await expect(page).toHaveURL(/\/login$/);
  await login(page, false);
  await expect(page.getByRole('link', { name: 'Auditoria', exact: true })).toHaveCount(0);
  await page.goto('/admin/audit-logs');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito aos administradores' }),
  ).toBeVisible();
  expect((await page.request.get(apiUrl)).status()).toBe(403);
  await expect(list(page)).toHaveCount(0);
});

test('auditoria mobile acessível sem overflow e com paginação', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await login(page);
  await page.getByRole('button', { name: 'Abrir administração' }).click();
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/rf45-audit-mobile.png', fullPage: true });
});

test('logout e troca de sessão removem dados administrativos da interface', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click();
  await expect(list(page).getByRole('listitem')).toHaveCount(20);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, false);
  await page.goto('/admin/audit-logs');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito aos administradores' }),
  ).toBeVisible();
  await expect(list(page)).toHaveCount(0);
  await expect(page.getByText(/RF45 removido/)).toHaveCount(0);
});
