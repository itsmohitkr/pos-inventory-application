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
      const settingsDialog = page.getByRole('dialog', { name: 'Settings' });
      await expect(settingsDialog).toBeVisible();
      return settingsDialog;
    },
    openUserManagementDialog: async () => {
      await settingsButton.click();
      await page.getByRole('menuitem', { name: 'Manage Users' }).click();
      const userDialog = page.getByRole('dialog', { name: 'User Management' });
      await expect(userDialog).toBeVisible();
      return userDialog;
    },
    openChangePasswordDialog: async () => {
      await settingsButton.click();
      await page.getByRole('menuitem', { name: 'Change Password' }).click();
      const pwdDialog = page.getByRole('dialog', { name: 'Change Password' });
      await expect(pwdDialog).toBeVisible();
      return pwdDialog;
    },
    closeSettingsDialog: async () => {
      const settingsDialog = page.getByRole('dialog');
      await page.getByRole('button', { name: 'Cancel' }).first().click();
      await expect(settingsDialog).not.toBeVisible();
    },
  };
};
