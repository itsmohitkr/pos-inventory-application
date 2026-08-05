import { expect, type Page } from '@playwright/test';

export const createPromotionsPage = (page: Page) => {
  const thresholdPanelTitle = page.getByText('Order Threshold Promotions');

  return {
    goto: async () => {
      await page.getByRole('link', { name: 'Promotions' }).click();
      await expect(page).toHaveURL(/#\/promotions/);
      await expect(thresholdPanelTitle).toBeVisible();
    },
    expectLoaded: async () => {
      await expect(page).toHaveURL(/#\/promotions/);
      await expect(thresholdPanelTitle).toBeVisible();
    },
    expectThresholdView: async () => {
      await expect(page.getByText('Order Threshold Promotions')).toBeVisible();
      await expect(page.getByText('PROMOTION MODULES')).toBeVisible();
    },
    openScheduledSales: async () => {
      await page.getByRole('button', { name: 'Scheduled Sales' }).click();
      await expect(page.getByText('Scheduled Sales & Campaigns')).toBeVisible();
    },
    openCreateSaleDialog: async () => {
      await page.getByRole('button', { name: 'Create New Event' }).click();
      const saleDialog = page.getByRole('dialog');
      await expect(saleDialog.getByText('Schedule New Sale Event')).toBeVisible();
      return saleDialog;
    },
    submitSaleEvent: async ({ name, productSearch }: { name: string; productSearch: string }) => {
      const saleDialog = page.getByRole('dialog');
      await saleDialog.getByLabel('Sale Name').fill(name);
      await saleDialog.getByLabel('Search Product').fill(productSearch);
      await page.getByRole('option', { name: /Masala Tea 250g/ }).click();
      await expect(saleDialog.getByText('Discount Amount')).toBeVisible();
      await saleDialog.getByRole('button', { name: 'Add' }).click();
      await expect(saleDialog.getByText('Masala Tea 250g')).toBeVisible();
      await saleDialog.getByRole('button', { name: 'Publish Sale' }).click();
      await expect(saleDialog).not.toBeVisible();
    },
    addThresholdRow: async (threshold: number | string) => {
      await page.getByPlaceholder('Order Total (₹)').fill(String(threshold));
      await page.getByRole('button', { name: 'Add Rule' }).click();
      await expect(page.getByText(`₹${threshold}`)).toBeVisible();
    },
    saveThresholdSettings: async () => {
      await page.getByRole('button', { name: 'Save Configuration' }).click();
    },
    editSaleEventName: async (currentName: string, nextName: string) => {
      const row = page.locator('tr', { hasText: currentName }).first();
      await row.getByRole('button').nth(0).click();
      const saleDialog = page.getByRole('dialog');
      await expect(saleDialog.getByText('Edit Sale Event')).toBeVisible();
      await saleDialog.getByLabel('Sale Name').fill(nextName);
      await saleDialog.getByRole('button', { name: 'Publish Sale' }).click();
      await expect(saleDialog).not.toBeVisible();
    },
    deleteSaleEvent: async (saleName: string) => {
      page.once('dialog', (dialog) => dialog.accept());
      const row = page.locator('tr', { hasText: saleName }).first();
      await row.getByRole('button').nth(1).click();
    },
    expectSaleVisible: async (saleName: string) => {
      await expect(page.getByText(saleName)).toBeVisible();
    },
    expectSaleNotVisible: async (saleName: string) => {
      await expect(page.locator('tr', { hasText: saleName })).toHaveCount(0);
    },
  };
};
