import { expect } from '@playwright/test';

const PRIMARY_NAV_LINKS = [
  'POS',
  'Sale History',
  'Inventory',
  'Reports',
  'Expenses',
  'Returns',
  'Promotions',
  'Dashboard',
];

export const createAppShellPage = (page) => {
  const settingsButton = page.getByLabel('Settings');

  return {
    expectPrimaryNavigation: async () => {
      for (const linkName of PRIMARY_NAV_LINKS) {
        await expect(page.getByRole('link', { name: linkName })).toBeVisible();
      }
      await expect(settingsButton).toBeVisible();
    },
    navigateTo: async (linkName) => {
      await page.getByRole('link', { name: linkName }).click();
    },
    openSettingsDialog: async () => {
      await settingsButton.click();
      await page.getByRole('menuitem', { name: 'Settings' }).click();
      const settingsDialog = page.getByRole('dialog');
      await expect(settingsDialog).toBeVisible();
      return settingsDialog;
    },
    closeSettingsDialog: async () => {
      const settingsDialog = page.getByRole('dialog');
      await page.getByRole('button', { name: 'Cancel' }).first().click();
      await expect(settingsDialog).not.toBeVisible();
    },
  };
};