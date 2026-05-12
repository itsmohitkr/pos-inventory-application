import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createCustomersPage } from './support/pages/customersPage';

test.describe('Customer management', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('can search, edit, and view history for a customer', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const customersPage = createCustomersPage(page);

    await customersPage.goto();
    
    // 1. Verify seeded customer visibility
    await customersPage.expectCustomerVisible('Test Customer');
    
    // 2. Search
    await customersPage.searchCustomer('9998887776');
    await customersPage.expectCustomerVisible('Test Customer');
    
    // 3. Edit
    await customersPage.openEditCustomer('Test Customer');
    await customersPage.submitEditCustomer({ name: 'Loyal Customer' });
    await customersPage.expectCustomerVisible('Loyal Customer');
    
    // 4. History
    await customersPage.openCustomerHistory('Loyal Customer');
    await customersPage.closeCustomerHistory();
    
    // 5. Preview Card
    await customersPage.previewCustomerCard('Loyal Customer');
    await customersPage.closePreview();

    await expectHealthyPage(page, failures);
  });
});
