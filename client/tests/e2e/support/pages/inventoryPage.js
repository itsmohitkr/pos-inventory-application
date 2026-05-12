import { expect } from '@playwright/test';

export const createInventoryPage = (page) => {
  const addProductButton = page.getByRole('button', { name: 'Add Product' });
  const detailPanel = page.getByTestId('inventory-detail-panel');

  const getProductRow = (productName) => page.locator('tr', { hasText: productName }).first();

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Inventory' }).click();
      await expect(page).toHaveURL(/#\/inventory/);
      await expect(addProductButton).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/inventory/);
      await expect(addProductButton).toBeVisible();
    },
    expectProductVisible: async (productName) => {
      await expect(page.getByRole('cell', { name: new RegExp(productName, 'i') })).toBeVisible();
    },
    expectProductStock: async (productName, stock) => {
      const row = getProductRow(new RegExp(productName, 'i'));
      await expect(row.getByRole('cell', { name: stock.toString(), exact: true })).toBeVisible();
    },
    openAddProductForm: async () => {
      await addProductButton.click();
      await expect(page.getByText('Add New Product')).toBeVisible();
    },
    submitNewProduct: async ({ name, category, quantity, mrp, costPrice, sellingPrice, lowStockThreshold, expiryDate }) => {
      // Tab 0: Product Details
      await page.getByLabel('Product Name').fill(name);
      await page.getByLabel('Category').fill(category);
      
      // Navigate to Tab 1: Stock & Quantity
      await page.getByRole('button', { name: 'Next' }).click();
      
      await page.getByLabel('Quantity').fill(quantity.toString());
      await page.getByLabel('MRP').fill(mrp.toString());
      await page.getByLabel('Cost Price').fill(costPrice.toString());
      await page.getByLabel('Selling Price').fill(sellingPrice.toString());

      if (expiryDate !== undefined) {
        const batchSwitch = page.getByLabel('Enable batch tracking');
        if (!(await batchSwitch.isChecked())) {
          await batchSwitch.click();
        }
        const expiryInput = page.getByLabel('Expiry Date');
        await expect(expiryInput).toBeVisible({ timeout: 5000 });
        await expiryInput.fill(expiryDate);
      }

      // Navigate to Tab 2: Settings
      await page.getByRole('button', { name: 'Next' }).click();

      if (lowStockThreshold !== undefined) {
        const lowStockSwitch = page.getByLabel('Enable low stock warning');
        const isChecked = await lowStockSwitch.isChecked();
        if (!isChecked) {
          await lowStockSwitch.click();
        }
        const thresholdInput = page.getByLabel('Low Stock Threshold');
        await expect(thresholdInput).toBeVisible({ timeout: 5000 });
        await thresholdInput.fill(lowStockThreshold.toString());
      }

      await page.getByRole('button', { name: 'Add Product' }).last().click();
    },
    acknowledgeSuccessDialog: async (message) => {
      const successDialog = page.getByRole('dialog');
      await expect(successDialog.getByText(message)).toBeVisible();
      await successDialog.getByRole('button', { name: 'OK' }).click();
    },
    openEditProductForm: async (productName) => {
      // Close detail panel if open to prevent interception
      const closeBtn = detailPanel.getByRole('button', { name: 'Close' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
      const row = getProductRow(productName);
      await row.getByRole('button', { name: 'Edit Product' }).click();
      await expect(page.getByRole('dialog', { name: 'Edit Product Information' })).toBeVisible();
    },
    saveEditedProductName: async (newName) => {
      const editDialog = page.getByRole('dialog', { name: 'Edit Product Information' });
      await editDialog.getByLabel('Product Name').fill(newName);
      await editDialog.getByRole('button', { name: 'Save Product' }).click();
      await expect(editDialog).not.toBeVisible();
    },
    selectProduct: async (productName) => {
      await getProductRow(new RegExp(productName, 'i')).click();
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
    },
    deleteProduct: async (productName) => {
      // Close detail panel if open to prevent interception
      const closeBtn = detailPanel.getByRole('button', { name: 'Close' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
      const row = getProductRow(productName);
      await row.getByRole('button', { name: 'Delete Product' }).click();
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/products') && response.request().method() === 'DELETE'
        ),
        page.getByRole('button', { name: 'Yes' }).click(),
      ]);
    },
    openQuickInventoryForProduct: async (productName) => {
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
      await detailPanel.locator('[data-testid^="inventory-quick-stock-"]').first().click();
      await expect(page.getByRole('dialog', { name: 'Quick Inventory' })).toBeVisible();
    },
    addStockInQuickInventory: async (quantity) => {
      const quickDialog = page.getByRole('dialog', { name: 'Quick Inventory' });
      await quickDialog.getByLabel('Add quantity').fill(String(quantity));
      await quickDialog.getByRole('button', { name: 'Update' }).click();
      await expect(page.getByText('Stock updated')).toBeVisible();
      await expect(quickDialog).not.toBeVisible({ timeout: 3000 });
    },
    expectSelectedProductTotalStock: async (quantity) => {
      await expect(page.getByTestId('inventory-detail-total-stock')).toHaveText(String(quantity));
    },
    expectProductNotVisible: async (productName) => {
      await expect(page.locator('tr', { hasText: new RegExp(productName, 'i') })).toHaveCount(0);
    },
    addCategory: async (categoryName) => {
      await page.getByTitle('Add category').click();
      const dialog = page.getByRole('dialog', { name: 'Add Category' });
      await dialog.getByLabel('Category name').fill(categoryName);
      await dialog.getByRole('button', { name: 'Add' }).click();
      await expect(dialog).not.toBeVisible();
    },
    selectCategory: async (categoryName) => {
      await page.getByRole('button', { name: new RegExp(categoryName, 'i') }).click();
    },
    deleteCategory: async (categoryName) => {
      const categoryButton = page.getByRole('button', { name: new RegExp(categoryName, 'i') });
      await categoryButton.click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Delete category' }).click();
    },
    expectCategoryVisible: async (categoryName) => {
      await expect(page.getByRole('button', { name: new RegExp(categoryName, 'i') })).toBeVisible();
    },
  };
};
