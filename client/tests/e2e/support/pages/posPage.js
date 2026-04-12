import { expect } from '@playwright/test';

export const createPosPage = (page) => {
  const productSearchInput = page.getByRole('combobox', { name: 'Scan Barcode or Search Item' });
  const payButton = page.getByRole('button', { name: /Pay\s*\[F10\]/ });

  return {
    expectLoaded: async () => {
      await expect(productSearchInput).toBeVisible();
    },
    addItemToCartBySearch: async (query) => {
      await productSearchInput.fill(query);
      await productSearchInput.press('Enter');
    },
    completeSale: async () => {
      await payButton.click();
    },
    expectSaleCompleted: async () => {
      await expect(page.getByText('Sale Completed Successfully!')).toBeVisible();
    },
  };
};