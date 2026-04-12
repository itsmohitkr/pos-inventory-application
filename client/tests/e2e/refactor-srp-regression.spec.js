import { expect, test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createReportsPage } from './support/pages/reportsPage';
import { createSaleHistoryPage } from './support/pages/saleHistoryPage';

test.describe('SRP refactor regression coverage', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('reporting supports custom timeframe apply in loose sales view', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const reportsPage = createReportsPage(page);

    await reportsPage.goto();

    await page.getByRole('button', { name: 'Loose Sales' }).click();
    await expect(page.getByText('Loose Sales History')).toBeVisible();

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Custom' }).click();

    await page.getByLabel('Start Date').fill('2026-01-01');
    await page.getByLabel('End Date').fill('2026-01-31');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('Loose Sales History')).toBeVisible();
    await expectHealthyPage(page, failures);
  });

  test('sale history toggles between POS and loose sales without breaking details', async ({
    page,
  }) => {
    const failures = collectRuntimeFailures(page);
    const saleHistoryPage = createSaleHistoryPage(page);

    await saleHistoryPage.goto();
    await saleHistoryPage.expectSaleVisible('ORD-11');

    await saleHistoryPage.switchToLooseSales();
    await saleHistoryPage.expectSaleVisible('Loose Rice');

    await page.getByRole('button', { name: 'POS Sales' }).click();
    await saleHistoryPage.selectSale('ORD-11');
    await saleHistoryPage.expectSelectedSaleDetails('Order ORD-11', 'Masala Tea 250g');

    await expectHealthyPage(page, failures);
  });

  test('inventory spreadsheet view opens and closes with data visible', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const inventoryPage = createInventoryPage(page);

    await inventoryPage.goto();
    await page.getByRole('button', { name: 'Spreadsheet View' }).click();

    await expect(page.getByText('Full Inventory Spreadsheet View')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Masala Tea 250g' })).toBeVisible();

    await page.getByRole('button', { name: 'close' }).click();
    await inventoryPage.expectLoaded();

    await expectHealthyPage(page, failures);
  });
});
