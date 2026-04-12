import { test, expect } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createPosPage } from './support/pages/posPage';
import { createExpensesPage } from './support/pages/expensesPage';

test.describe('SRP refactor regression for POS and Expenses', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('POS sale flow remains stable after SRP split', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const posPage = createPosPage(page);

    await posPage.expectLoaded();
    await posPage.addItemToCartBySearch('Masala Tea 250g');
    await expect(page.getByText('Masala Tea 250g')).toBeVisible();

    await posPage.completeSale();
    await posPage.expectSaleCompleted();

    await expectHealthyPage(page, failures);
  });

  test('Expenses custom date filter and CRUD flow remain stable after SRP split', async ({
    page,
  }) => {
    const failures = collectRuntimeFailures(page);
    const expensesPage = createExpensesPage(page);

    await expensesPage.goto();

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Custom Date' }).click();
    await page.getByLabel('Start').fill('2026-01-01');
    await page.getByLabel('End').fill('2026-01-31');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expensesPage.createExpense({
      amount: 345,
      category: 'Maintenance',
      description: 'Refactor regression expense',
    });
    await expensesPage.expectRowVisible('Refactor regression expense');
    await expensesPage.deleteExpense('Refactor regression expense');
    await expensesPage.expectRowNotVisible('Refactor regression expense');

    await expectHealthyPage(page, failures);
  });
});
