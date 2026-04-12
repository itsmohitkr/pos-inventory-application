import { expect } from '@playwright/test';

export const createExpensesPage = (page) => {
  const pageTitle = page.getByRole('heading', { name: 'Financial Tracking' });

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Expenses' }).click();
      await expect(page).toHaveURL(/#\/expenses/);
      await expect(pageTitle).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/expenses/);
      await expect(pageTitle).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Expenses' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Inventory Purchases' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Expense' })).toBeVisible();
    },
    createExpense: async ({ amount, category, description }) => {
      await page.getByRole('button', { name: 'Add Expense' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Add New Expense')).toBeVisible();
      await dialog.getByRole('spinbutton', { name: /^Amount$/ }).fill(String(amount));
      await dialog.getByLabel('Expenses for?').fill(category);
      await dialog.getByLabel('Description').fill(description);
      await dialog.getByRole('button', { name: 'Successful' }).click();
      await expect(dialog).not.toBeVisible();
    },
    openPurchasesTab: async () => {
      await page.getByRole('tab', { name: 'Inventory Purchases' }).click();
    },
    createPurchase: async ({ vendor, totalAmount, note }) => {
      await page.getByRole('button', { name: 'Log Purchase' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Log Inventory Purchase')).toBeVisible();
      await dialog.getByLabel('Vendor Name').fill(vendor);
      await dialog.getByRole('spinbutton', { name: 'Total Amount' }).fill(String(totalAmount));
      await dialog.getByLabel('Note').fill(note);
      await dialog.getByRole('button', { name: 'Successful' }).click();
      await expect(dialog).not.toBeVisible();
    },
    deleteExpense: async (description) => {
      const row = page.locator('tr', { hasText: description }).first();
      await row.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    },
    deletePurchase: async (vendor) => {
      const row = page.locator('tr', { hasText: vendor }).first();
      await row.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    },
    expectRowVisible: async (text) => {
      await expect(page.locator('tr', { hasText: text }).first()).toBeVisible();
    },
    expectRowNotVisible: async (text) => {
      await expect(page.locator('tr', { hasText: text })).toHaveCount(0);
    },
  };
};