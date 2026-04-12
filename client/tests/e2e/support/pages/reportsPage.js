import { expect } from '@playwright/test';

export const createReportsPage = (page) => {
  const reportSelector = page.getByText('SELECT REPORT');
  const cashFlowSection = page.getByText('CASH FLOW STATEMENT (CHRONOLOGICAL)');

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Reports' }).click();
      await expect(page).toHaveURL(/#\/reports/);
      await expect(reportSelector).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/reports/);
      await expect(reportSelector).toBeVisible();
      await expect(cashFlowSection).toBeVisible();
    },
  };
};
