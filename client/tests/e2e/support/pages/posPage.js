import { expect } from '@playwright/test';

export const createPosPage = (page) => {
  const productSearchInput = page.getByRole('combobox', { name: 'Scan Barcode or Search Item' });
  const payButton = page.getByRole('button', { name: /Pay\s*\[F10\]/ });

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'POS' }).click();
      await expect(page).toHaveURL(/#\//);
      await expect(productSearchInput).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(productSearchInput).toBeVisible();
    },
    addItemToCartBySearch: async (query) => {
      await productSearchInput.fill(query);
      const listbox = page.getByRole('listbox');
      await expect(listbox).toBeVisible({ timeout: 5000 });
      await listbox.getByRole('option', { name: new RegExp(query, 'i') }).first().click();
      // Wait for state update after selection animation
      await page.waitForTimeout(500);
    },
    applyDiscount: async (amount) => {
      await page.getByPlaceholder('0.00').click();
      const numpad = page.getByRole('dialog', { name: 'Extra Discount' });
      await expect(numpad).toBeVisible();
      const digits = String(amount).split('');
      for (const digit of digits) {
        await numpad.getByRole('button', { name: digit, exact: true }).click();
      }
      // The confirm button is labeled "Enter", not "OK"
      await numpad.getByRole('button', { name: 'Enter' }).click();
    },
    openLooseSale: async () => {
      // Button text is "+ LOOSE SALE [F8]"
      await page.getByRole('button', { name: /LOOSE SALE/i }).click();
      await expect(page.getByRole('dialog', { name: /Loose Sale/i })).toBeVisible();
    },
    addTab: async () => {
      await page.getByRole('button', { name: 'Add Tab' }).click();
    },
    switchTab: async (index) => {
      await page.getByRole('tab').nth(index).click();
    },
    completeSale: async () => {
      await payButton.click();
    },
    expectSaleCompleted: async () => {
      await expect(page.getByText('Sale Completed Successfully!')).toBeVisible();
    },
    expectNetPayable: async (amount) => {
      const netPayable = page.getByTestId('pos-net-payable');
      await expect(netPayable).toContainText(amount.toFixed(2));
    },
    expectSubtotal: async (amount) => {
      const subtotal = page.getByTestId('pos-subtotal');
      await expect(subtotal).toContainText(amount.toFixed(2));
    },
  };
};
