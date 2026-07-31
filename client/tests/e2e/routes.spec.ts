import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createInventoryPage } from './support/pages/inventoryPage';
import { createPromotionsPage } from './support/pages/promotionsPage';
import { createReportsPage } from './support/pages/reportsPage';
import { createExpensesPage } from './support/pages/expensesPage';
import { createDashboardPage } from './support/pages/dashboardPage';

test.describe('Admin route rendering', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('inventory page renders management shell', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const inventoryPage = createInventoryPage(page);

    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
    await inventoryPage.expectProductVisible('Masala Tea 250g');

    await expectHealthyPage(page, failures);
  });

  test('reports page renders analytics shell', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const reportsPage = createReportsPage(page);

    await reportsPage.goto();
    await reportsPage.expectLoaded();

    await expectHealthyPage(page, failures);
  });

  test('expenses page renders expenses and purchases workspace', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const expensesPage = createExpensesPage(page);

    await expensesPage.goto();
    await expensesPage.expectLoaded();

    await expectHealthyPage(page, failures);
  });

  test('promotions page renders thresholds and scheduled sales', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const promotionsPage = createPromotionsPage(page);

    await promotionsPage.goto();
    await promotionsPage.expectLoaded();
    await promotionsPage.expectThresholdView();

    await expectHealthyPage(page, failures);
  });

  test('dashboard page renders KPI and chart shell', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const dashboardPage = createDashboardPage(page);

    await appShellPage.navigateTo('Dashboard');
    await dashboardPage.expectLoaded();

    await expectHealthyPage(page, failures);
  });
});
