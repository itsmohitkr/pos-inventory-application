import { expect, type Page } from '@playwright/test';

export const createExpensesPage = (page: Page) => {
  const pageTitle = page.getByRole('heading', { name: 'Expenses & Purchases' });

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Expenses' }).click();
      await expect(page).toHaveURL(/#\/expenses/);
      await expect(pageTitle).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/expenses/);
      await expect(pageTitle).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Operating Expenses' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Inventory Purchases' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Expense' })).toBeVisible();
    },
    createExpense: async ({
      amount,
      category,
      description,
    }: {
      amount: number | string;
      category: string;
      description: string;
    }) => {
      await page.getByRole('button', { name: 'Add Expense' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Add New Expense')).toBeVisible();
      await dialog.getByRole('spinbutton', { name: /^Amount$/ }).fill(String(amount));
      await dialog.getByLabel('Expenses for?').fill(category);
      await dialog.getByLabel('Description').fill(description);
      await dialog.getByRole('button', { name: 'Record' }).click();
      await expect(dialog).not.toBeVisible();
    },
    openPurchasesTab: async () => {
      await page.getByRole('tab', { name: 'Inventory Purchases' }).click();
    },
    createPurchase: async ({
      vendor,
      totalAmount,
      note,
    }: {
      vendor: string;
      totalAmount: number | string;
      note: string;
    }) => {
      await page.getByRole('button', { name: 'Log Purchase' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Log Inventory Purchase')).toBeVisible();
      await dialog.getByLabel('Vendor Name').fill(vendor);
      await dialog.getByRole('spinbutton', { name: 'Total Amount' }).fill(String(totalAmount));
      await dialog.getByLabel('Note').fill(note);
      await dialog.getByRole('button', { name: 'Record' }).click();
      await expect(dialog).not.toBeVisible();
    },
    deleteExpense: async (description: string) => {
      const row = page.locator('tr', { hasText: description }).first();
      await row.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    },
    deletePurchase: async (vendor: string) => {
      const row = page.locator('tr', { hasText: vendor }).first();
      await row.getByRole('button', { name: 'Delete' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    },
    expectRowVisible: async (text: string) => {
      await expect(page.locator('tr', { hasText: text }).first()).toBeVisible();
    },
    expectRowNotVisible: async (text: string) => {
      await expect(page.locator('tr', { hasText: text })).toHaveCount(0);
    },
  };
};
