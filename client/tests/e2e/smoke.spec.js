import { test, expect } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';

test.describe('Frontend smoke', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
  });

  test('admin login and primary navigation visibility', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);

    await loginAsAdmin(page);

    await appShellPage.expectPrimaryNavigation();

    await expectHealthyPage(page, failures);
  });

  test('settings menu and dialog open', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);

    await loginAsAdmin(page);

    const settingsDialog = await appShellPage.openSettingsDialog();
    await expect(settingsDialog.getByRole('heading', { name: 'Shop Information' })).toBeVisible();

    await appShellPage.closeSettingsDialog();

    await expectHealthyPage(page, failures);
  });
});
