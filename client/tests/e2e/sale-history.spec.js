import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createSaleHistoryPage } from './support/pages/saleHistoryPage';

test.describe('Sale history flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('sale history shows seeded POS sale details and can delete a loose sale', async ({
    page,
  }) => {
    const failures = collectRuntimeFailures(page);
    const saleHistoryPage = createSaleHistoryPage(page);

    await saleHistoryPage.goto();
    await saleHistoryPage.expectSaleVisible('ORD-11');
    await saleHistoryPage.selectSale('ORD-11');
    await saleHistoryPage.expectSelectedSaleDetails('Order ORD-11', 'Masala Tea 250g');

    await saleHistoryPage.switchToLooseSales();
    await saleHistoryPage.expectSaleVisible('Loose Rice');
    await saleHistoryPage.deleteLooseSale('Loose Rice');
    await saleHistoryPage.expectLooseSaleNotVisible('Loose Rice');

    await expectHealthyPage(page, failures);
  });
});
