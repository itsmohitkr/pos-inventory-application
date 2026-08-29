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
      // Category is an MUI Autocomplete — filling it opens a suggestions
      // dropdown that stays open (and animating) until dismissed. Left open,
      // it can still be intercepting pointer events over whatever sits below
      // it (here, the Generate button) when the next click fires — a real,
      // reproducible race, not just a timing fluke. Escape closes it the same
      // way a user tabbing/clicking away would.
      await page.keyboard.press('Escape');

      // Barcode is required server-side (CreateProductSchema). Generate one
      // instead of hardcoding a value, matching how a cashier without a
      // scanner uses this form. Waits for the actual barcode chip (a random
      // 13-digit number) to render, since that's the real signal the async
      // uniqueness check (addBarcode) succeeded — checking the input's
      // enabled state instead would race the brief disabled-while-checking
      // window and could pass before the check even started. Scoped to the
      // right-hand panel (an inline Paper now, not a Dialog or Drawer — it
      // renders in-page via InventoryPanelShell, identified by its
      // data-testid), since other products' 13-digit barcodes are already
      // visible in the table behind it and would otherwise match too.
      const addProductPanel = page.getByTestId('inventory-detail-panel');
      await addProductPanel.getByRole('button', { name: 'Generate' }).click();
      await expect(addProductPanel.getByText(/^\d{13}$/)).toBeVisible({ timeout: 5000 });

      // 'Initial Quantity' (not just 'Quantity') — the Inventory Alert
      // Settings section's info icon has an aria-label containing the word
      // "quantity" too ("Automatically flags product when quantity drops
      // below the alert threshold."), which getByLabel's substring matching
      // would otherwise also match, making the locator ambiguous.
      await page.getByLabel('Initial Quantity').fill(quantity.toString());
      await page.getByLabel('MRP').fill(mrp.toString());
      await page.getByLabel('Cost Price').fill(costPrice.toString());
      await page.getByLabel('Selling Price').fill(sellingPrice.toString());

      if (expiryDate !== undefined) {
        const batchSwitch = page.getByLabel('Enable Batch & Expiry Tracking');
        if (!(await batchSwitch.isChecked())) {
          await batchSwitch.click();
        }
        // getByLabel('Expiry Date') is ambiguous — the batch-tracking
        // switch's info icon has an aria-label containing "expiry dates"
        // too. Scoping to the textbox role excludes the (non-textbox) icon.
        const expiryInput = page.getByRole('textbox', { name: 'Expiry Date' });
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
      // Edit/Delete now live behind the detail panel's "Product Actions"
      // menu, not on the row itself — select the product first (the panel
      // is a grid column now, not an overlay, so it no longer covers the
      // list and there's nothing left to close before selecting).
      await getProductRow(productName).click();
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
      await detailPanel.getByRole('button', { name: 'Product Actions' }).click();
      await page.getByRole('menuitem', { name: 'Edit Product' }).click();
      // InlineEditProductForm renders in-panel now, not a modal dialog.
      await expect(detailPanel.getByText('Edit Product Information')).toBeVisible();
    },
    saveEditedProductName: async (newName: string) => {
      await detailPanel.getByLabel('Product Name').fill(newName);
      await detailPanel.getByRole('button', { name: 'Save Product' }).click();
      await expect(detailPanel.getByText('Edit Product Information')).not.toBeVisible();
    },
    selectProduct: async (productName: string) => {
      await getProductRow(new RegExp(productName, 'i')).click();
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
    },
    deleteProduct: async (productName: string) => {
      // Same "Product Actions" menu flow as openEditProductForm above.
      await getProductRow(productName).click();
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
      await detailPanel.getByRole('button', { name: 'Product Actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete Product' }).click();
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/products') && response.request().method() === 'DELETE'
        ),
        page.getByRole('button', { name: 'Yes' }).click(),
      ]);
    },
    openQuickInventoryForProduct: async (productName: string) => {
      // Quick Stock Update is an inline form on the batch card now, not a
      // modal dialog — scoped to the panel since "Add Quantity" could
      // otherwise match a field in another open inline form.
      await expect(detailPanel).toContainText(new RegExp(productName, 'i'));
      await detailPanel.locator('[data-testid^="inventory-quick-stock-"]').first().click();
      await expect(detailPanel.getByLabel('Add Quantity')).toBeVisible();
    },
    addStockInQuickInventory: async (quantity: number | string) => {
      await detailPanel.getByLabel('Add Quantity').fill(String(quantity));
      await detailPanel.getByRole('button', { name: 'Update Stock' }).click();
      // "Updated ✓" chip is the inline confirmation (see ProductBatchTable's
      // isJustUpdated), and the form itself collapses on success.
      await expect(detailPanel.getByText('Updated ✓')).toBeVisible({ timeout: 5000 });
      await expect(detailPanel.getByLabel('Add Quantity')).not.toBeVisible({ timeout: 3000 });
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
