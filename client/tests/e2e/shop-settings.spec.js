import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createSettingsPage } from './support/pages/settingsPage';

test.describe('Shop Settings flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await page.goto('/');
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('admin can update shop information and it persists', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const settingsPage = createSettingsPage(page);

    await appShellPage.openSettingsDialog();
    await settingsPage.expectLoaded();
    await settingsPage.openAccountTab();

    // 1. Update shop information
    await settingsPage.updateShopMetadata({
      name: 'SuperMart 2026',
      mobile: '9123456789',
      email: 'admin@supermart.com',
      address: '456 New Commercial Ave, Silicon City',
      gst: '22AAAAA1111A1Z5',
    });

    // 2. Refresh page (to test persistence via mock state)
    await page.reload();
    
    // 3. Re-open and verify
    await appShellPage.openSettingsDialog();
    await settingsPage.openAccountTab();
    await settingsPage.verifyShopMetadata({
      name: 'SuperMart 2026',
      mobile: '9123456789',
      email: 'admin@supermart.com',
      address: '456 New Commercial Ave, Silicon City',
      gst: '22AAAAA1111A1Z5',
    });

    await expectHealthyPage(page, failures);
  });
});
