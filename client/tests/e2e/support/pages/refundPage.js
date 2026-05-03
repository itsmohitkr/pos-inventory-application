import { expect } from '@playwright/test';

export const createRefundPage = (page) => {
  const heading = page.getByRole('heading', { name: 'Process Returns' });
  const orderIdInput = page.getByPlaceholder('Enter Order ID (e.g. ORD-17)');

  return {
    expectLoaded: async () => {
      await expect(heading).toBeVisible();
      await expect(orderIdInput).toBeVisible();
    },
    searchOrderById: async (saleId) => {
      await orderIdInput.fill(String(saleId));
      await page.getByRole('button', { name: 'SEARCH' }).click();
    },
    selectAllReturnableItems: async () => {
      await page.getByRole('checkbox').first().check();
    },
    processReturns: async () => {
      await page.getByRole('button', { name: 'Process Returns' }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
    },
    expectRefundSuccess: async () => {
      await expect(orderIdInput).toHaveValue('');
      await expect(page.getByRole('button', { name: 'Process Returns' })).toHaveCount(0);
    },
  };
};
