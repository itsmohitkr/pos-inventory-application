import { expect, type Page } from '@playwright/test';

export const createDashboardPage = (page: Page) => {
  return {
    expectLoaded: async () => {
      await expect(page.getByText('Monthly Sales')).toBeVisible();
      await expect(page.getByText('Daily Sales')).toBeVisible();
      await expect(page.getByText('Top Products')).toBeVisible();
    },
    expectSaleTotal: async (total: number | string) => {
      // Find the card containing 'Daily Sales' and check its value.
      // `getByTypography` was never a real Playwright API (no locator method by
      // that name exists) — this method has no callers today, but converting
      // to TS surfaces the call as a real compile error, so it's corrected
      // here to the equivalent `getByText` rather than left broken.
      const dailySalesCard = page.locator('.MuiCard-root', { hasText: 'Daily Sales' });
      await expect(dailySalesCard.getByText(new RegExp(String(total)))).toBeVisible();
    },
    expectTransactionCount: async (count: number | string) => {
      const transCard = page.locator('.MuiCard-root', { hasText: 'Transactions' });
      await expect(transCard).toContainText(String(count));
    }
  };
};
