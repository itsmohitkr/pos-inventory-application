import { expect, type Page } from '@playwright/test';

export const createRefundPage = (page: Page) => {
  const searchInput = page.getByPlaceholder('Enter Order ID (e.g. ORD-17)');
  const searchButton = page.getByRole('button', { name: 'SEARCH' });

  return {
    expectLoaded: async () => {
      await expect(page.getByRole('heading', { name: 'Process Returns' })).toBeVisible();
      await expect(searchInput).toBeVisible();
    },
    searchOrder: async (orderId: string) => {
      await searchInput.fill(orderId);
      await searchButton.click();
    },
    searchOrderById: async (id: number | string) => {
      await searchInput.fill(id.toString());
      await searchButton.click();
    },
    expectOrderLoaded: async (orderId: number | string) => {
      await expect(page.getByText(`ORD-${orderId}`, { exact: false })).toBeVisible();
    },
    selectItemForReturn: async (productName: string) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      await row.getByRole('checkbox').click();
    },
    selectAllReturnableItems: async () => {
      // Click the 'select all' checkbox in the header
      await page.locator('thead').getByRole('checkbox').click();
    },
    setReturnQuantity: async (productName: string, quantity: number | string) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      const qtyInput = row.getByRole('spinbutton');
      await qtyInput.fill(quantity.toString());
    },
    processReturn: async () => {
      await page.getByRole('button', { name: 'Process Returns' }).click();
      const confirmDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText(/Are you sure you want to process this return/i),
      });
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();

      // Success now renders as an auto-dismissing toast, not a modal dialog.
      const successToast = page.getByRole('alert').filter({
        hasText: 'Return processed successfully!',
      });
      await expect(successToast).toBeVisible();
      await successToast.getByRole('button', { name: 'Close' }).click();
    },
    processReturns: async () => {
      await page.getByRole('button', { name: 'Process Returns' }).click();
      const confirmDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText(/Are you sure you want to process this return/i),
      });
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();
    },
    expectRefundSuccess: async () => {
      const successToast = page.getByRole('alert').filter({
        hasText: 'Return processed successfully!',
      });
      await expect(successToast).toBeVisible();
      await successToast.getByRole('button', { name: 'Close' }).click();
    },
    expectItemReturnedStatus: async (productName: string, returnedQty: number | string) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      await expect(row.getByText(returnedQty.toString())).toBeVisible();
    }
  };
};
