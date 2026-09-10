import { expect, type Page } from '@playwright/test';
import { openSidebarIfCollapsed } from '../sidebarNav';

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
      await openSidebarIfCollapsed(page);
      await page.getByRole('link', { name: linkName }).click();
    },
    openSettingsDialog: async () => {
      await openSidebarIfCollapsed(page);
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
      await openSidebarIfCollapsed(page);
      if ((await settingsButton.getAttribute('aria-expanded')) !== 'true') {
        await settingsButton.click();
      }
      const storeSettingsBtn = page.getByRole('menuitem', { name: 'Store Settings' });
      await storeSettingsBtn.scrollIntoViewIfNeeded();
      await storeSettingsBtn.click();
      await page.getByRole('tab', { name: 'User Management' }).click();
      const userContainer = page.locator('[data-testid="user-management-tab"], [role="dialog"]').filter({
        has: page.getByRole('button', { name: 'Add User' }),
      });
      await expect(userContainer).toBeVisible();
      return userContainer;
    },
    openChangePasswordDialog: async () => {
      await openSidebarIfCollapsed(page);
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
