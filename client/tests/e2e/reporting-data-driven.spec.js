import { test, expect } from '@playwright/test';
import { createPosPage } from './support/pages/posPage';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createReportsPage } from './support/pages/reportsPage';
import { createAppShellPage } from './support/pages/appShellPage';
import { loginAsAdmin, clearBrowserStorage, installMockApi } from './support/testHelpers';

test.describe('Reporting Data Integrity', () => {
  let posPage;
  let inventoryPage;
  let reportsPage;
  let appShellPage;

  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
    posPage = createPosPage(page);
    inventoryPage = createInventoryPage(page);
    reportsPage = createReportsPage(page);
    appShellPage = createAppShellPage(page);
  });

  test('Low Stock report correctly reflects products below threshold', async ({ page }) => {
    const productName = `LowStockItem-${Date.now()}`;
    
    // 1. Create a product with low stock threshold
    await inventoryPage.goto();
    await inventoryPage.openAddProductForm();
    await inventoryPage.submitNewProduct({
      name: productName,
      category: 'Electronics',
      quantity: 5,
      mrp: 100,
      costPrice: 80,
      sellingPrice: 95,
      lowStockThreshold: 10
    });
    await inventoryPage.acknowledgeSuccessDialog('Product added successfully');

    // 2. Verify it appears in Low Stock report
    await reportsPage.goto();
    await reportsPage.selectReport('Low Stock');
    await reportsPage.expectReportRow(productName);
    
    // 3. Update stock above threshold and verify it disappears
    await inventoryPage.goto();
    await inventoryPage.selectProduct(productName);
    await inventoryPage.openQuickInventoryForProduct(productName);
    await inventoryPage.addStockInQuickInventory(10); // 5 + 10 = 15 (> 10)
    
    await reportsPage.goto();
    await reportsPage.selectReport('Low Stock');
    await expect(page.locator('tr', { hasText: productName })).toHaveCount(0);
  });

  test('Expiring Products report correctly reflects near-expiry batches', async ({ page }) => {
    const productName = `ExpiringItem-${Date.now()}`;
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 5); // Expires in 5 days
    const expiryStr = expiryDate.toISOString().split('T')[0];

    // 1. Create a product with near-expiry date
    await inventoryPage.goto();
    await inventoryPage.openAddProductForm();
    await inventoryPage.submitNewProduct({
      name: productName,
      category: 'Perishables',
      quantity: 50,
      mrp: 20,
      costPrice: 15,
      sellingPrice: 18,
      expiryDate: expiryStr
    });
    await inventoryPage.acknowledgeSuccessDialog('Product added successfully');

    // 2. Verify it appears in Expiring Products report
    await reportsPage.goto();
    await reportsPage.selectReport('Expiring Products');
    await reportsPage.setTimeframe('This Month');
    
    // Ensure the date range covers the expiry date
    await reportsPage.expectReportRow(productName);
  });

  test('Loose Sales report reflects correctly', async ({ page }) => {
    const looseItemName = `LooseItem-${Date.now()}`;
    const price = 45.50;

    // 1. Process a loose sale in POS
    await posPage.goto();
    await posPage.addLooseItem(looseItemName, price);

    // 2. Verify in Loose Sales report
    await reportsPage.goto();
    await reportsPage.selectReport('Loose Sales');
    await reportsPage.expectReportRow(looseItemName);
    await reportsPage.expectReportRow(price.toFixed(2));
  });
});
