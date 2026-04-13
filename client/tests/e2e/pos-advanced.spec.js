import { test, expect } from '@playwright/test';
import {
    clearBrowserStorage,
    collectRuntimeFailures,
    expectHealthyPage,
    installMockApi,
    loginAsAdmin,
} from './support/testHelpers';
import { createPosPage } from './support/pages/posPage';

test.describe('Advanced POS functionality', () => {
    test.beforeEach(async ({ page }) => {
        await installMockApi(page);
        await clearBrowserStorage(page);
        await loginAsAdmin(page);
    });

    test('EXTRA DISCOUNTS are applied and calculated correctly', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const posPage = createPosPage(page);

        await posPage.goto();
        await posPage.addItemToCartBySearch('Masala Tea 250g'); // Selling Price 95

        // Initial total
        await posPage.expectNetPayable(95);

        // Apply 5 INR discount
        await posPage.applyDiscount(5);

        // Verify new total (95 - 5 = 90)
        await posPage.expectNetPayable(90);

        await posPage.completeSale();
        await posPage.expectSaleCompleted();

        await expectHealthyPage(page, failures);
    });

    test('LOOSE SALES can be processed without linked inventory product', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const posPage = createPosPage(page);

        await posPage.goto();
        await posPage.openLooseSale();

        // The LooseSaleDialog uses a numpad for price entry
        const looseDialog = page.getByRole('dialog', { name: /Loose Sale/i });

        // Enter item name (optional field)
        await looseDialog.getByPlaceholder('Item Name / Notes (Optional)').fill('Fresh Ginger 100g');

        // Enter price using numpad buttons: 2, 0
        await looseDialog.getByRole('button', { name: '2', exact: true }).click();
        await looseDialog.getByRole('button', { name: '0', exact: true }).click();

        // Submit with "Complete Sale" button
        await looseDialog.getByRole('button', { name: 'Complete Sale' }).click();

        // Loose sales complete directly via API, not through the cart
        // The dialog should close on success
        await expect(looseDialog).not.toBeVisible({ timeout: 5000 });

        await expectHealthyPage(page, failures);
    });

    test('MULTI-TAB support allows managing independent carts', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const posPage = createPosPage(page);

        await posPage.goto();

        // Tab 1: add Tea
        await posPage.addItemToCartBySearch('Masala Tea 250g');
        await posPage.expectNetPayable(95);

        // Add Tab 2
        await posPage.addTab();
        await posPage.switchTab(1);

        // Tab 2 should be empty
        await posPage.expectNetPayable(0);
        await posPage.addItemToCartBySearch('Basmati Rice 1kg');
        await posPage.expectNetPayable(130);

        // Switch back to Tab 1
        await posPage.switchTab(0);
        await posPage.expectNetPayable(95);

        await expectHealthyPage(page, failures);
    });
});
