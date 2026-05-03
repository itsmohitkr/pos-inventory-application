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
      await expect(page.getByText(productName)).toBeVisible();
    },
    openAddProductForm: async () => {
      await addProductButton.click();
      await expect(page.getByText('Add New Product')).toBeVisible();
    },
    submitNewProduct: async ({ name, category, quantity, mrp, costPrice, sellingPrice }) => {
      await page.getByLabel('Product Name').fill(name);
      await page.getByLabel('Category').fill(category);
      await page.getByLabel('Quantity').fill(quantity);
      await page.getByLabel('MRP').fill(mrp);
      await page.getByLabel('Cost Price').fill(costPrice);
      await page.getByLabel('Selling Price').fill(sellingPrice);
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
      await getProductRow(productName).click();
      await expect(detailPanel).toContainText(productName);
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
      await expect(detailPanel).toContainText(productName);
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
      await expect(page.locator('tr', { hasText: productName })).toHaveCount(0);
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
      // Handle potential confirmation dialog if any (checking sidebar code, it calls onDeleteCategory)
    },
    expectCategoryVisible: async (categoryName) => {
      await expect(page.getByRole('button', { name: new RegExp(categoryName, 'i') })).toBeVisible();
    },
  };
};
