import { expect } from '@playwright/test';

export const createCustomersPage = (page) => {
  const pageTitle = page.getByRole('heading', { name: 'Customer Management' });
  const searchInput = page.getByPlaceholder('Search customers by name, phone number, or barcode...');

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Customers' }).click();
      await expect(page).toHaveURL(/#\/customers/);
      await expect(pageTitle).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(pageTitle).toBeVisible();
      await expect(searchInput).toBeVisible();
    },
    searchCustomer: async (query) => {
      await searchInput.fill(query);
      // Wait for debounced search
      await page.waitForTimeout(500);
    },
    expectCustomerVisible: async (name) => {
      await expect(page.locator('tr', { hasText: name }).first()).toBeVisible();
    },
    expectCustomerNotVisible: async (name) => {
      await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    },
    openEditCustomer: async (name) => {
      const row = page.locator('tr', { hasText: name }).first();
      await row.getByRole('button', { name: 'Edit Details' }).click();
      await expect(page.getByRole('dialog', { name: 'Edit Customer' })).toBeVisible();
    },
    submitEditCustomer: async ({ name, phone }) => {
      const dialog = page.getByRole('dialog', { name: 'Edit Customer' });
      if (name) await dialog.getByLabel('Name (Optional)').fill(name);
      if (phone) await dialog.getByLabel('Phone Number').fill(phone);
      await dialog.getByRole('button', { name: 'Save Changes' }).click();
      await expect(dialog).not.toBeVisible();
    },
    openCustomerHistory: async (name) => {
      await page.locator('tr', { hasText: name }).first().click();
      await expect(page.getByText('TOTAL PURCHASES')).toBeVisible();
    },
    closeCustomerHistory: async () => {
      await page.getByRole('button', { name: 'Close' }).last().click();
    },
    previewCustomerCard: async (name) => {
      const row = page.locator('tr', { hasText: name }).first();
      await row.getByRole('button', { name: 'Preview Card' }).click();
      await expect(page.getByRole('dialog', { name: 'Premium Card Preview' })).toBeVisible();
    },
    closePreview: async () => {
      await page.getByRole('button', { name: 'Close Preview' }).click();
    },
  };
};
