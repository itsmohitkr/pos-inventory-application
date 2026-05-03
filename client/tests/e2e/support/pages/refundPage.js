import { expect } from '@playwright/test';

export const createRefundPage = (page) => {
  const searchInput = page.getByPlaceholder('Enter Order ID (e.g. ORD-17)');
  const searchButton = page.getByRole('button', { name: 'SEARCH' });

  return {
    expectLoaded: async () => {
      await expect(page.getByRole('heading', { name: 'Process Returns' })).toBeVisible();
      await expect(searchInput).toBeVisible();
    },
    searchOrder: async (orderId) => {
      await searchInput.fill(orderId);
      await searchButton.click();
    },
    searchOrderById: async (id) => {
      await searchInput.fill(id.toString());
      await searchButton.click();
    },
    expectOrderLoaded: async (orderId) => {
      await expect(page.getByText(`ORD-${orderId}`, { exact: false })).toBeVisible();
    },
    selectItemForReturn: async (productName) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      await row.getByRole('checkbox').click();
    },
    selectAllReturnableItems: async () => {
      // Click the 'select all' checkbox in the header
      await page.locator('thead').getByRole('checkbox').click();
    },
    setReturnQuantity: async (productName, quantity) => {
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
      
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Return processed successfully!', { exact: false }),
      });
      await successDialog.getByRole('button', { name: 'OK' }).click();
    },
    processReturns: async () => {
      await page.getByRole('button', { name: 'Process Returns' }).click();
      const confirmDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText(/Are you sure you want to process this return/i),
      });
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();
    },
    expectRefundSuccess: async () => {
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Return processed successfully!', { exact: false }),
      });
      await expect(successDialog).toBeVisible();
      await successDialog.getByRole('button', { name: 'OK' }).click();
    },
    expectItemReturnedStatus: async (productName, returnedQty, totalQty) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      await expect(row.getByText(returnedQty.toString())).toBeVisible();
    }
  };
};
