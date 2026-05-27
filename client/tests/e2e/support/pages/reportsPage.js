import { expect } from '@playwright/test';

export const createReportsPage = (page) => {
  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Reports' }).click();
      await expect(page).toHaveURL(/#\/reports/);
      await expect(page.getByRole('heading', { name: 'Reports & Analytics' })).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/reports/);
      await expect(page.getByRole('heading', { name: 'Reports & Analytics' })).toBeVisible();
      // 'Cash Flow Report' is a button in the sidebar
      await expect(page.getByRole('button', { name: 'Cash Flow Report' })).toBeVisible();
    },
    expectReportRow: async (text) => {
      await expect(page.locator('tr', { hasText: text }).first()).toBeVisible();
    },
    selectDateRange: async (startDate, endDate) => {
      // Date inputs only render when the "Custom" timeframe is selected.
      // MUI Select doesn't use a standard label association, so use the
      // same text-ancestor pattern as setTimeframe.
      await page.getByText('Time Frame').locator('..').getByRole('combobox').click();
      await page.getByRole('option', { name: 'Custom' }).click();
      const startInput = page.locator('input[type="date"]').first();
      await startInput.waitFor({ state: 'visible' });
      await startInput.fill(startDate);
      await page.locator('input[type="date"]').last().fill(endDate);
      await page.getByRole('button', { name: 'Apply' }).click();
    },
    selectReport: async (label) => {
      await page.getByRole('button', { name: label }).click();
    },
    setTimeframe: async (label) => {
      // Find the combobox that is near the "Time Frame" text
      await page.getByText('Time Frame').locator('..').getByRole('combobox').click();
      await page.getByRole('option', { name: label }).click();
    }
  };
};
