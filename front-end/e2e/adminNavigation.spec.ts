import { test, expect, login } from './fixtures';

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
