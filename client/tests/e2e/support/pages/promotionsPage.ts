import { expect, type Page } from '@playwright/test';
import { openSidebarIfCollapsed } from '../sidebarNav';

export const createPromotionsPage = (page: Page) => {
  const thresholdPanelTitle = page.getByText('Order Threshold Promotions');

  // Row click toggles the edit sidebar open/closed. Creating a sale leaves its
  // sidebar open already selected, so a later click on that same row would
  // close it instead of opening it — close whatever's open first for a
  // deterministic "open this row's sidebar" action.
  const openSaleRow = async (saleName: string) => {
    const closeButton = page.getByRole('button', { name: 'Close Sidebar' });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
    await page.getByRole('button', { name: `Edit scheduled event ${saleName}` }).click();
  };

  return {
    goto: async () => {
      await openSidebarIfCollapsed(page);
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
    // Sale creation and editing use an inline row-editing sidebar, not a modal dialog.
    openCreateSaleDialog: async () => {
      await page.getByRole('button', { name: 'Create New Event' }).click();
      await expect(page.getByText('New Scheduled Sale')).toBeVisible();
    },
    submitSaleEvent: async ({ name, productSearch }: { name: string; productSearch: string }) => {
      await page.getByPlaceholder('e.g. Summer Festival Clearance').fill(name);
      await page.getByLabel('Search product or scan barcode').fill(productSearch);
      await page.getByRole('option', { name: /Masala Tea 250g/ }).click();
      await expect(page.getByText('Masala Tea 250g')).toBeVisible();
      await page.getByRole('button', { name: 'Create Event' }).click();
    },
    addThresholdRow: async (threshold: number | string) => {
      await page.getByRole('button', { name: 'Add new rule' }).click();
      await page.getByPlaceholder('e.g. 500').fill(String(threshold));
      await page.getByRole('button', { name: 'Create Rule' }).click();
      // Creating a rule opens its edit sidebar immediately, which also shows the
      // threshold value — scope to the table row to avoid matching both.
      await expect(page.getByRole('button', { name: `Edit rule for threshold ${threshold}` })).toBeVisible();
    },
    editSaleEventName: async (currentName: string, nextName: string) => {
      await openSaleRow(currentName);
      await expect(page.getByText(`Scheduled Sale: ${currentName}`)).toBeVisible();
      await page.getByPlaceholder('e.g. Summer Festival Clearance').fill(nextName);
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText(`Scheduled Sale: ${nextName}`)).toBeVisible();
    },
    deleteSaleEvent: async (saleName: string) => {
      await openSaleRow(saleName);
      await page.getByText('Remove sale').click();
      const confirmDialog = page.getByRole('dialog').filter({ hasText: 'Remove Sale Event' });
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();
    },
    expectSaleVisible: async (saleName: string) => {
      // Scoped to the table row: the edit sidebar can be open at the same time
      // and shows the same name in its heading.
      await expect(page.locator('tr', { hasText: saleName })).toBeVisible();
    },
    expectSaleNotVisible: async (saleName: string) => {
      await expect(page.locator('tr', { hasText: saleName })).toHaveCount(0);
    },
  };
};
