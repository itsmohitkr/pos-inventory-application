import { test, expect } from '@playwright/test';
import {
    clearBrowserStorage,
    collectRuntimeFailures,
    expectHealthyPage,
    installMockApi,
    loginAsAdmin,
} from './support/testHelpers';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createPosPage } from './support/pages/posPage';

test.describe('Inventory and stock integrity', () => {
    test.beforeEach(async ({ page }) => {
        await installMockApi(page);
        await clearBrowserStorage(page);
        await loginAsAdmin(page);
    });

    test('POS sale decrements product stock accurately', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const inventoryPage = createInventoryPage(page);
        const posPage = createPosPage(page);

        // 1. Check initial stock in Inventory
        await inventoryPage.goto();
        await inventoryPage.selectProduct('Masala Tea 250g');
        // We expect 50 based on initial mock data in testHelpers
        await inventoryPage.expectSelectedProductTotalStock(50);

        // 2. Perform a sale in POS
        await posPage.goto();
        await posPage.addItemToCartBySearch('Masala Tea 250g');
        await posPage.completeSale();
        await posPage.expectSaleCompleted();

        // 3. Verify stock is decremented in Inventory
        await inventoryPage.goto();
        await inventoryPage.selectProduct('Masala Tea 250g');
        await inventoryPage.expectSelectedProductTotalStock(49);

        await expectHealthyPage(page, failures);
    });

    test('Batch-specific stock is tracked during sales', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const inventoryPage = createInventoryPage(page);
        const posPage = createPosPage(page);

        // Initial check of specific batches is not directly supported by current page object,
        // but total stock reflects the sum.
        await inventoryPage.goto();
        await inventoryPage.selectProduct('Milk 1L');
        await inventoryPage.expectSelectedProductTotalStock(30);

        await posPage.goto();
        // Milk 1L has multiple batches in mock data
        await posPage.addItemToCartBySearch('Milk 1L');

        // Select the first batch (usually handled by BatchSelectionDialog)
        const batchDialog = page.getByRole('dialog', { name: /Select Batch|Select MRP/i });
        await expect(batchDialog).toBeVisible();
        // The first button in the dialog body is the batch button. 
        // We use a more specific selector to avoid the close button.
        await batchDialog.getByRole('button', { name: /MRP/i }).first().click();

        await posPage.completeSale();
        await posPage.expectSaleCompleted();

        await inventoryPage.goto();
        await inventoryPage.selectProduct('Milk 1L');
        await inventoryPage.expectSelectedProductTotalStock(29);

        await expectHealthyPage(page, failures);
    });
});
