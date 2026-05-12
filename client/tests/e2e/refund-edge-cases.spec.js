import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createPosPage } from './support/pages/posPage';
import { createRefundPage } from './support/pages/refundPage';
import { createInventoryPage } from './support/pages/inventoryPage';

test.describe('Refund Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await page.goto('/');
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test.slow();
  test('admin can process a partial return and stock is reconciled', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const posPage = createPosPage(page);
    const refundPage = createRefundPage(page);
    const inventoryPage = createInventoryPage(page);

    const PRODUCT_NAME = 'Masala Tea 250g';
    const INITIAL_STOCK = 50;

    // 1. Verify initial stock
    await appShellPage.navigateTo('Inventory');
    await inventoryPage.expectLoaded();
    await inventoryPage.expectProductStock(PRODUCT_NAME, INITIAL_STOCK);

    // 2. Perform a new sale of 5 units
    await appShellPage.navigateTo('POS');
    await posPage.addItemToCartBySearch(PRODUCT_NAME);
    await posPage.updateItemQuantity(PRODUCT_NAME, '5');
    await posPage.processPayment();
    await posPage.closeReceiptPreview();

    // 3. Verify stock is now 45 (50 - 5)
    await appShellPage.navigateTo('Inventory');
    await inventoryPage.expectProductStock(PRODUCT_NAME, INITIAL_STOCK - 5);

    // 4. Go to Returns and process a partial return of a PREVIOUS sale (ORD-11)
    // ORD-11 has 2 units of Masala Tea 250g.
    await appShellPage.navigateTo('Returns');
    await refundPage.expectLoaded();
    await refundPage.searchOrder('11');
    await refundPage.expectOrderLoaded('11');

    // 5. Partial return: return 1 out of 2 units from ORD-11
    await refundPage.selectItemForReturn(PRODUCT_NAME);
    await refundPage.setReturnQuantity(PRODUCT_NAME, 1);
    await refundPage.processReturn();

    // 6. Verify stock is reconciled: 45 (after new sale) + 1 (returned from old sale) = 46
    await appShellPage.navigateTo('Inventory');
    await inventoryPage.expectProductStock(PRODUCT_NAME, INITIAL_STOCK - 5 + 1);

    await expectHealthyPage(page, failures);
  });
});
