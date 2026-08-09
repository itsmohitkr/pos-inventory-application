import { expect, type Page } from '@playwright/test';

interface NewProductFields {
  name: string;
  category: string;
  quantity: number | string;
  mrp: number | string;
  costPrice: number | string;
  sellingPrice: number | string;
  lowStockThreshold?: number | string;
  expiryDate?: string;
}

export const createInventoryPage = (page: Page) => {
  // Scoped to #root, not just role+name: the Add Product dialog's own submit
  // button shares this exact label and is rendered via a portal outside
  // #root, so an unscoped locator matches two elements while the dialog is
  // open or mid-close-animation — a real, reproducible race, not just a
  // timing fluke (confirmed via a failed CI run's trace: the page button
  // resolved through locator('#root')..., the dialog's did not).
  const addProductButton = page.locator('#root').getByRole('button', { name: 'Add Product' });
  const detailPanel = page.getByTestId('inventory-detail-panel');

  const getProductRow = (productName: string | RegExp) =>
    page.locator('tr', { hasText: productName }).first();

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
    expectProductVisible: async (productName: string) => {
      await expect(page.getByRole('cell', { name: new RegExp(productName, 'i') })).toBeVisible();
    },
    expectProductStock: async (productName: string, stock: number | string) => {
      const row = getProductRow(new RegExp(productName, 'i'));
      await expect(row.getByRole('cell', { name: stock.toString(), exact: true })).toBeVisible();
    },
    openAddProductForm: async () => {
      await addProductButton.click();
      await expect(page.getByText('Add New Product')).toBeVisible();
    },
    submitNewProduct: async ({
      name,
      category,
      quantity,
      mrp,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      expiryDate,
    }: NewProductFields) => {
      // The form is a single scrollable page now (previously a 3-tab wizard
      // with Next/Back navigation) — every field is already visible, no
      // step navigation needed between them.
      await page.getByLabel('Product Name').fill(name);
      await page.getByLabel('Category').fill(category);

      // Barcode is required server-side (CreateProductSchema). Generate one
      // instead of hardcoding a value, matching how a cashier without a
      // scanner uses this form. Waits for the actual barcode chip (a random
      // 13-digit number) to render, since that's the real signal the async
      // uniqueness check (addBarcode) succeeded — checking the input's
      // enabled state instead would race the brief disabled-while-checking
      // window and could pass before the check even started. Scoped to the
      // drawer (an MUI Drawer, not a Dialog — it has no aria-labelledby, so
      // it can only be matched by role, not by name), since other products'
      // 13-digit barcodes are already visible in the table behind it and
      // would otherwise match too.
      const addProductDialog = page.getByRole('dialog');
      await addProductDialog.getByRole('button', { name: 'Generate' }).click();
      await expect(addProductDialog.getByText(/^\d{13}$/)).toBeVisible({ timeout: 5000 });

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
    acknowledgeSuccessDialog: async (message: string) => {
      const successDialog = page.getByRole('dialog');
      await expect(successDialog.getByText(message)).toBeVisible();
      await successDialog.getByRole('button', { name: 'OK' }).click();
    },
    openEditProductForm: async (productName: string) => {
      // Close detail panel if open to prevent interception
      const closeBtn = detailPanel.getByRole('button', { name: 'Close' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
      const row = getProductRow(productName);
      await row.getByRole('button', { name: 'Edit Product' }).click();
      await expect(page.getByRole('dialog', { name: 'Edit Product Information' })).toBeVisible();
    },
    saveEditedProductName: async (newName: string) => {
      const editDialog = page.getByRole('dialog', { name: 'Edit Product Information' });
      await editDialog.getByLabel('Product Name').fill(newName);
      await editDialog.getByRole('button', { name: 'Save Product' }).click();
      await expect(editDialog).not.toBeVisible();
    },
    selectProduct: async (productName: string) => {
      await getProductRow(new RegExp(productName, 'i')).click();
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
    },
    deleteProduct: async (productName: string) => {
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
    openQuickInventoryForProduct: async (productName: string) => {
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
      await detailPanel.locator('[data-testid^="inventory-quick-stock-"]').first().click();
      await expect(page.getByRole('dialog', { name: 'Quick Inventory' })).toBeVisible();
    },
    addStockInQuickInventory: async (quantity: number | string) => {
      const quickDialog = page.getByRole('dialog', { name: 'Quick Inventory' });
      await quickDialog.getByLabel('Add quantity').fill(String(quantity));
      await quickDialog.getByRole('button', { name: 'Update' }).click();
      await expect(page.getByText('Stock updated')).toBeVisible();
      await expect(quickDialog).not.toBeVisible({ timeout: 3000 });
    },
    expectSelectedProductTotalStock: async (quantity: number | string) => {
      await expect(page.getByTestId('inventory-detail-total-stock')).toHaveText(String(quantity));
    },
    expectProductNotVisible: async (productName: string) => {
      await expect(page.locator('tr', { hasText: new RegExp(productName, 'i') })).toHaveCount(0);
    },
    addCategory: async (categoryName: string) => {
      await page.getByTitle('Add category').click();
      const dialog = page.getByRole('dialog', { name: 'Add Category' });
      await dialog.getByLabel('Category name').fill(categoryName);
      await dialog.getByRole('button', { name: 'Add' }).click();
      await expect(dialog).not.toBeVisible();
    },
    selectCategory: async (categoryName: string) => {
      await page.getByRole('button', { name: new RegExp(categoryName, 'i') }).click();
    },
    deleteCategory: async (categoryName: string) => {
      const categoryButton = page.getByRole('button', { name: new RegExp(categoryName, 'i') });
      await categoryButton.click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Delete category' }).click();
    },
    expectCategoryVisible: async (categoryName: string) => {
      await expect(page.getByRole('button', { name: new RegExp(categoryName, 'i') })).toBeVisible();
    },
  };
};
