import { expect } from '@playwright/test';

export const createSaleHistoryPage = (page) => {
  const saleHistoryTitle = page.getByRole('heading', { name: 'Sale History' });

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Sale History' }).click();
      await expect(page).toHaveURL(/#\/sale-history/);
      await expect(saleHistoryTitle).toBeVisible();
    },
    switchTimeframe: async (label) => {
      await page.locator('[role="combobox"]').last().click();
      await page.getByRole('option', { name: label }).click();
    },
    expectSaleVisible: async (orderLabel) => {
      await expect(page.locator('tr', { hasText: orderLabel }).first()).toBeVisible();
    },
    selectSale: async (orderLabel) => {
      await page.locator('tr', { hasText: orderLabel }).click();
    },
    expectSelectedSaleDetails: async (orderLabel, productName) => {
      await expect(page.getByText(orderLabel)).toBeVisible();
      await expect(page.getByText(productName)).toBeVisible();
      await expect(page.getByText('Products (1)')).toBeVisible();
    },
    switchToLooseSales: async () => {
      await page.getByRole('button', { name: 'Loose Sales' }).click();
    },
    deleteLooseSale: async (itemName) => {
      const row = page.locator('tr', { hasText: itemName }).first();
      await row.getByRole('button').click();
      await page.getByRole('button', { name: 'Delete' }).click();
    },
    expectLooseSaleNotVisible: async (itemName) => {
      await expect(page.locator('tr', { hasText: itemName })).toHaveCount(0);
    },
  };
};
