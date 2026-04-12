import { expect } from '@playwright/test';

export const createDashboardPage = (page) => {
  return {
    expectLoaded: async () => {
      await expect(page.getByText('Monthly Sales')).toBeVisible();
      await expect(page.getByText('Daily Sales')).toBeVisible();
      await expect(page.getByText('Top Products')).toBeVisible();
    },
  };
};