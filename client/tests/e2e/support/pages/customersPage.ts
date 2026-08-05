import { expect, type Page } from '@playwright/test';

export const createCustomersPage = (page: Page) => {
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
    searchCustomer: async (query: string) => {
      await searchInput.fill(query);
      // Wait for debounced search
      await page.waitForTimeout(500);
    },
    expectCustomerVisible: async (name: string) => {
      await expect(page.locator('tr', { hasText: name }).first()).toBeVisible();
    },
    expectCustomerNotVisible: async (name: string) => {
      await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    },
    openEditCustomer: async (name: string) => {
      const row = page.locator('tr', { hasText: name }).first();
      await row.getByRole('button', { name: 'Edit Details' }).click();
      await expect(page.getByRole('dialog', { name: 'Edit Customer' })).toBeVisible();
    },
    submitEditCustomer: async ({ name, phone }: { name?: string; phone?: string }) => {
      const dialog = page.getByRole('dialog', { name: 'Edit Customer' });
      if (name) await dialog.getByLabel('Name (Optional)').fill(name);
      if (phone) await dialog.getByLabel('Phone Number').fill(phone);
      await dialog.getByRole('button', { name: 'Save Changes' }).click();
      await expect(dialog).not.toBeVisible();
    },
    openCustomerHistory: async (name: string) => {
      await page.locator('tr', { hasText: name }).first().click();
      await expect(page.getByText('TOTAL PURCHASES')).toBeVisible();
    },
    closeCustomerHistory: async () => {
      await page.getByRole('button', { name: 'Close' }).last().click();
    },
    previewCustomerCard: async (name: string) => {
      const row = page.locator('tr', { hasText: name }).first();
      await row.getByRole('button', { name: 'Preview Card' }).click();
      await expect(page.getByRole('dialog', { name: 'Premium Card Preview' })).toBeVisible();
    },
    closePreview: async () => {
      await page.getByRole('button', { name: 'Close Preview' }).click();
    },
  };
};
