import { test, expect } from '@playwright/test';
import {
    clearBrowserStorage,
    collectRuntimeFailures,
    expectHealthyPage,
    installMockApi,
    loginAsAdmin,
} from './support/testHelpers';
import { createPosPage } from './support/pages/posPage';

test.describe('Promotion application logic', () => {
    test.beforeEach(async ({ page }) => {
        await installMockApi(page);
        await clearBrowserStorage(page);
        await loginAsAdmin(page);
    });

    test('Order threshold promotion (Buy X Get 1) applies automatically in POS', async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const posPage = createPosPage(page);

        // Mock fixtures have promotion_buy_x_get_free enabled with threshold: 150
        await posPage.goto();

        // Masala Tea (Selling Price 95) x 2 = 190 > 150
        await posPage.addItemToCartBySearch('Masala Tea 250g');
        await posPage.addItemToCartBySearch('Masala Tea 250g');

        // Check for the promotion nudge/indicator
        await expect(page.getByText('View Eligible Offers')).toBeVisible({ timeout: 10000 });

        // Complete sale and verify success
        await posPage.completeSale();
        await posPage.expectSaleCompleted();

        await expectHealthyPage(page, failures);
    });
});
