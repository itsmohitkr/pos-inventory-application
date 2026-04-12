import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createPromotionsPage } from './support/pages/promotionsPage';
import { createSettingsPage } from './support/pages/settingsPage';

test.describe('Promotions and settings flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('can save threshold settings and edit delete a scheduled sale', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const promotionsPage = createPromotionsPage(page);

    await promotionsPage.goto();
    await promotionsPage.expectThresholdView();
    await promotionsPage.addThresholdRow(150);
    await promotionsPage.saveThresholdSettings();

    await promotionsPage.openScheduledSales();
    await promotionsPage.openCreateSaleDialog();
    await promotionsPage.submitSaleEvent({ name: 'Midweek Saver', productSearch: 'Masala Tea' });
    await promotionsPage.expectSaleVisible('Midweek Saver');
    await promotionsPage.editSaleEventName('Midweek Saver', 'Midweek Saver Updated');
    await promotionsPage.expectSaleVisible('Midweek Saver Updated');
    await promotionsPage.deleteSaleEvent('Midweek Saver Updated');
    await promotionsPage.expectSaleNotVisible('Midweek Saver Updated');

    await expectHealthyPage(page, failures);
  });

  test('can update payment settings from the settings dialog', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const settingsPage = createSettingsPage(page);

    await appShellPage.openSettingsDialog();
    await settingsPage.expectLoaded();
    await settingsPage.openPaymentSettingsTab();
    await settingsPage.expectPaymentMethodChecked('UPI', false);
    await settingsPage.togglePaymentMethod('UPI');
    await settingsPage.expectPaymentMethodChecked('UPI', true);
    await settingsPage.addCustomMethod('Store Credit');

    await expectHealthyPage(page, failures);
  });
});
