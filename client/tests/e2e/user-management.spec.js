import { test } from '@playwright/test';
import {
  clearBrowserStorage,
  collectRuntimeFailures,
  expectHealthyPage,
  installMockApi,
  loginAsAdmin,
} from './support/testHelpers';
import { createAppShellPage } from './support/pages/appShellPage';
import { createUsersPage } from './support/pages/usersPage';

test.describe('User Management flows', () => {
  test.beforeEach(async ({ page }) => {
    await installMockApi(page);
    await page.goto('/');
    await clearBrowserStorage(page);
    await loginAsAdmin(page);
  });

  test('admin can create, edit, and delete a user', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const usersPage = createUsersPage(page);

    await appShellPage.openUserManagementDialog();
    await usersPage.expectLoaded();

    // 1. Create a new salesman
    await usersPage.openAddUserDialog();
    await usersPage.submitNewUser({
      username: 'johndoe',
      password: 'password123',
      role: 'salesman',
    });
    await usersPage.expectUserVisible('johndoe');
    await usersPage.expectUserRole('johndoe', 'salesman');

    // 2. Edit user role to admin
    await usersPage.openEditUserDialog('johndoe');
    await usersPage.updateUserRole('admin');
    await usersPage.expectUserRole('johndoe', 'admin');

    // 3. Delete the user
    await usersPage.deleteUser('johndoe');
    await usersPage.expectUserNotVisible('johndoe');

    await expectHealthyPage(page, failures);
  });
});
