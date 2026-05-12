import { expect, test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createPosPage } from './support/pages/posPage';
import { createRefundPage } from './support/pages/refundPage';

test.describe('Critical business journeys', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('cash sale can be completed and fully refunded', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const posPage = createPosPage(page);
    const refundPage = createRefundPage(page);

    await posPage.expectLoaded();
    await posPage.addItemToCartBySearch('Masala Tea 250g');

    const [saleResponse] = await Promise.all([
      page.waitForResponse((response) => {
        return response.url().includes('/api/sale') && response.request().method() === 'POST';
      }),
      posPage.completeSale(),
    ]);

    const salePayload = await saleResponse.json();
    const saleId = salePayload.saleId;
    expect(saleId).toBeTruthy();

    await posPage.expectSaleCompleted();
    await posPage.closeReceiptPreview();

    await appShellPage.navigateTo('Returns');
    await refundPage.expectLoaded();
    await refundPage.searchOrderById(saleId);
    await refundPage.selectAllReturnableItems();
    await refundPage.processReturns();
    await refundPage.expectRefundSuccess();

    await expectHealthyPage(page, failures);
  });

  test('inventory product supports edit, stock update, and delete', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const inventoryPage = createInventoryPage(page);

    await inventoryPage.goto();
    await inventoryPage.openAddProductForm();
    await inventoryPage.submitNewProduct({
      name: 'Critical Stock Test Item',
      category: 'Snacks',
      quantity: '5',
      mrp: '30',
      costPrice: '20',
      sellingPrice: '25',
    });
    await inventoryPage.acknowledgeSuccessDialog('Product added successfully!');

    await inventoryPage.openEditProductForm('Critical Stock Test Item');
    await inventoryPage.saveEditedProductName('Critical Stock Test Updated');
    await inventoryPage.expectProductVisible('Critical Stock Test Updated');
    await inventoryPage.selectProduct('Critical Stock Test Updated');
    await inventoryPage.expectSelectedProductTotalStock(5);

    await inventoryPage.openQuickInventoryForProduct('Critical Stock Test Updated');
    await inventoryPage.addStockInQuickInventory(3);
    await inventoryPage.expectSelectedProductTotalStock(8);

    await inventoryPage.deleteProduct('Critical Stock Test Updated');
    await inventoryPage.expectProductNotVisible('Critical Stock Test Updated');

    await expectHealthyPage(page, failures);
  });
});
