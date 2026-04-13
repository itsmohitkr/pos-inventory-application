import { expect } from '@playwright/test';

export const createDashboardPage = (page) => {
  return {
    expectLoaded: async () => {
      await expect(page.getByText('Monthly Sales')).toBeVisible();
      await expect(page.getByText('Daily Sales')).toBeVisible();
      await expect(page.getByText('Top Products')).toBeVisible();
    },
    expectSaleTotal: async (total) => {
      // Find the card containing 'Daily Sales' and check its value
      const dailySalesCard = page.locator('.MuiCard-root', { hasText: 'Daily Sales' });
      await expect(dailySalesCard.getByTypography({ text: new RegExp(String(total)) })).toBeVisible();
    },
    expectTransactionCount: async (count) => {
      const transCard = page.locator('.MuiCard-root', { hasText: 'Transactions' });
      await expect(transCard).toContainText(String(count));
    }
  };
};
