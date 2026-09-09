import { expect, type Page } from '@playwright/test';

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

export const createAppShellPage = (page: Page) => {
  const settingsButton = page.getByLabel('Settings');

  return {
    expectPrimaryNavigation: async () => {
      for (const linkName of PRIMARY_NAV_LINKS) {
        await expect(page.getByRole('link', { name: linkName })).toBeVisible();
      }
      await expect(settingsButton).toBeVisible();
    },
    navigateTo: async (linkName: string) => {
      const openSidebarBtn = page.getByRole('button', { name: 'Open sidebar' });
      if (await openSidebarBtn.isVisible()) {
        await openSidebarBtn.click();
      }
      await page.getByRole('link', { name: linkName }).click();
    },
    openSettingsDialog: async () => {
      if ((await settingsButton.getAttribute('aria-expanded')) !== 'true') {
        await settingsButton.click();
      }
      const storeSettingsBtn = page.getByRole('menuitem', { name: 'Store Settings' });
      await storeSettingsBtn.scrollIntoViewIfNeeded();
      await storeSettingsBtn.click();
      const settingsContainer = page.locator('[data-testid="store-settings-page"], [role="dialog"]').filter({
        has: page.getByRole('tab', { name: 'Payment' }),
      });
      await expect(settingsContainer).toBeVisible();
      return settingsContainer;
    },
    openUserManagementDialog: async () => {
      if ((await settingsButton.getAttribute('aria-expanded')) !== 'true') {
        await settingsButton.click();
      }
      await page.getByRole('menuitem', { name: 'Manage Users' }).click();
      const userDialog = page.getByRole('dialog', { name: 'User Management' });
      await expect(userDialog).toBeVisible();
      return userDialog;
    },
    openChangePasswordDialog: async () => {
      if ((await settingsButton.getAttribute('aria-expanded')) !== 'true') {
        await settingsButton.click();
      }
      await page.getByRole('menuitem', { name: 'Change Password' }).click();
      const pwdDialog = page.getByRole('dialog', { name: 'Change Password' });
      await expect(pwdDialog).toBeVisible();
      return pwdDialog;
    },
    closeSettingsDialog: async () => {
      const settingsDialog = page.getByRole('dialog');
      if ((await settingsDialog.count()) > 0 && (await settingsDialog.first().isVisible())) {
        await page.getByRole('button', { name: 'Cancel' }).first().click();
        await expect(settingsDialog).not.toBeVisible();
      }
    },
  };
};
