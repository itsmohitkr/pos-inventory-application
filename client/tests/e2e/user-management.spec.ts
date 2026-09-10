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

  test('admin can reset a user\'s password, with client-side validation', async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const appShellPage = createAppShellPage(page);
    const usersPage = createUsersPage(page);

    await appShellPage.openUserManagementDialog();
    await usersPage.expectLoaded();

    await usersPage.openAddUserDialog();
    await usersPage.submitNewUser({
      username: 'janedoe',
      password: 'password123',
      role: 'cashier',
    });
    await usersPage.expectUserVisible('janedoe');

    // Mismatched passwords are rejected without calling the API.
    await usersPage.openResetPasswordDialog('janedoe');
    await usersPage.submitResetPassword({
      newPassword: 'newpassword123',
      confirmPassword: 'doesNotMatch123',
    });
    await usersPage.expectResetPasswordError(/do not match/i);

    // Too-short passwords are rejected too.
    await usersPage.submitResetPassword({
      newPassword: 'short1',
      confirmPassword: 'short1',
    });
    await usersPage.expectResetPasswordError(/at least 8 characters/i);

    // A valid, matching password succeeds and closes the dialog.
    await usersPage.submitResetPassword({
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    await usersPage.expectResetPasswordDialogClosed();

    await expectHealthyPage(page, failures);
  });
});
