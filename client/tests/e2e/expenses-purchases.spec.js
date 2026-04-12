import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createExpensesPage } from './support/pages/expensesPage';

test.describe('Expenses and purchases flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('can create and delete an expense and a purchase', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const expensesPage = createExpensesPage(page);

    await expensesPage.goto();
    await expensesPage.createExpense({
      amount: 275,
      category: 'Maintenance',
      description: 'Shelf repair',
    });
    await expensesPage.expectRowVisible('Shelf repair');
    await expensesPage.deleteExpense('Shelf repair');
    await expensesPage.expectRowNotVisible('Shelf repair');

    await expensesPage.openPurchasesTab();
    await expensesPage.createPurchase({
      vendor: 'Metro Foods',
      totalAmount: 640,
      note: 'Weekly staples',
    });
    await expensesPage.expectRowVisible('Metro Foods');
    await expensesPage.deletePurchase('Metro Foods');
    await expensesPage.expectRowNotVisible('Metro Foods');

    await expectHealthyPage(page, failures);
  });
});
