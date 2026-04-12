import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createPromotionsPage } from './support/pages/promotionsPage';

test.describe('Admin action flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('inventory add product flow returns to list with new product', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const inventoryPage = createInventoryPage(page);

    await inventoryPage.goto();
    await inventoryPage.openAddProductForm();
    await inventoryPage.submitNewProduct({
      name: 'ginger biscuits',
      category: 'Snacks',
      quantity: '15',
      mrp: '20',
      costPrice: '12',
      sellingPrice: '18',
    });
    await inventoryPage.acknowledgeSuccessDialog('Product added successfully!');
    await inventoryPage.expectLoaded();
    await inventoryPage.expectProductVisible('Ginger Biscuits');

    await expectHealthyPage(page, failures);
  });

  test('promotions create sale flow adds a scheduled sale', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const promotionsPage = createPromotionsPage(page);

    await appShellPage.navigateTo('Promotions');
    await promotionsPage.expectLoaded();
    await promotionsPage.openScheduledSales();
    await promotionsPage.openCreateSaleDialog();
    await promotionsPage.submitSaleEvent({ name: 'Flash Friday', productSearch: 'Masala Tea' });
    await promotionsPage.expectSaleVisible('Flash Friday');

    await expectHealthyPage(page, failures);
  });
});
