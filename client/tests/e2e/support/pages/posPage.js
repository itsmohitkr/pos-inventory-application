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
      const option = listbox.getByRole('option', { name: new RegExp(query, 'i') }).first();
      await expect(option).toBeVisible();
      await option.click();
      // Wait for state update after selection animation and API calls
      await page.waitForTimeout(1000);
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
    addLooseItem: async (name, price) => {
      await page.getByRole('button', { name: /LOOSE SALE/i }).click();
      const dialog = page.getByRole('dialog', { name: /Loose Sale/i });
      await expect(dialog).toBeVisible();
      const nameInput = dialog.getByPlaceholder(/Item Name/i);
      await nameInput.fill(name);
      await nameInput.blur(); // Ensure numeric input goes to price
      
      // Use keyboard to type price since the field is read-only but has a listener
      await page.keyboard.type(String(price));
      
      await dialog.getByRole('button', { name: 'Complete Sale' }).click();
      await expect(page.getByText('Loose Sale Recorded Successfully!')).toBeVisible();
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
    updateItemQuantity: async (productName, quantity) => {
      const row = page.getByRole('row', { name: new RegExp(productName, 'i') });
      const qtyCell = row.getByRole('cell').nth(2); // Qty column
      await qtyCell.click();
      
      // The dialog title is "Set Quantity [Product Name]"
      const numpad = page.getByRole('dialog', { name: /Set Quantity/i });
      await expect(numpad).toBeVisible();
      
      const digits = String(quantity).split('');
      for (const digit of digits) {
        await numpad.getByRole('button', { name: digit, exact: true }).click();
      }
      
      // Numpad in quantity dialog uses "Confirm"
      await numpad.getByRole('button', { name: 'Confirm' }).click();
    },
    processPayment: async () => {
      await payButton.click();
      // Wait for the actual dialog title to ensure the modal is open
      await expect(page.getByText('Bill Preview & Settings')).toBeVisible({ timeout: 10000 });
    },
    closeReceiptPreview: async () => {
      // Use the specific test-id for the close button
      await page.getByTestId('close-receipt-dialog').click({ force: true });
      // Verify the dialog is gone, rather than just the text (to avoid POSPrintContainer conflict)
      await expect(page.getByRole('dialog', { name: /Bill Preview/i })).not.toBeVisible();
    },
  };
};
