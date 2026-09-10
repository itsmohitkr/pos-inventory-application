import { expect, type Page } from '@playwright/test';

export const createUsersPage = (page: Page) => {
  const container = page.locator('[data-testid="user-management-tab"], [role="dialog"]').filter({
    has: page.getByRole('button', { name: 'Add User' }),
  });

  return {
    expectLoaded: async () => {
      await expect(container).toBeVisible();
      await expect(container.getByRole('button', { name: 'Add User' })).toBeVisible();
    },
    openAddUserDialog: async () => {
      await container.getByRole('button', { name: 'Add User' }).first().click();
      const addForm = page.locator('[data-testid="add-user-form"], [role="region"][aria-label="Add New User"], [role="dialog"]').filter({
        has: page.getByRole('heading', { name: 'Add New User' }),
      });
      await expect(addForm).toBeVisible();
    },
    submitNewUser: async ({
      username,
      password,
      role,
    }: {
      username: string;
      password: string;
      role: string;
    }) => {
      const addForm = page.locator('[data-testid="add-user-form"], [role="region"][aria-label="Add New User"], [role="dialog"]').filter({
        has: page.getByRole('heading', { name: 'Add New User' }),
      });
      await addForm.locator('input[data-testid="add-user-username"], input[placeholder="Enter username"]').fill(username);
      await addForm.locator('input[data-testid="add-user-password"], input[placeholder="Enter password"], input[type="password"]').fill(password);
      await addForm.getByRole('combobox', { name: 'Role' }).click();
      await page.getByRole('option', { name: new RegExp(role, 'i') }).click();
      await addForm.getByRole('button', { name: 'Add User' }).click();
      await expect(addForm).not.toBeVisible({ timeout: 10000 });
    },
    expectUserVisible: async (username: string) => {
      await expect(container.getByRole('cell', { name: username })).toBeVisible();
    },
    expectUserNotVisible: async (username: string) => {
      await expect(container.getByRole('cell', { name: username })).not.toBeVisible();
    },
    openEditUserDialog: async (username: string) => {
      const row = container.getByRole('row', { name: new RegExp(username, 'i') });
      await row.getByRole('button', { name: /Edit user/i }).click();
      const editDialog = page.getByRole('dialog', { name: /Edit User/i });
      await expect(editDialog).toBeVisible();
    },
    updateUserRole: async (role: string) => {
      const editDialog = page.getByRole('dialog', { name: /Edit User/i });
      await editDialog.getByRole('combobox', { name: 'Role' }).click();
      await page.getByRole('option', { name: new RegExp(role, 'i') }).click();
      await editDialog.getByRole('button', { name: 'Save Changes' }).click();
      await expect(editDialog).not.toBeVisible();
    },
    deleteUser: async (username: string) => {
      const row = container.getByRole('row', { name: new RegExp(username, 'i') });
      await row.getByRole('button', { name: /Delete user/i }).click();

      const confirmDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText(/Are you sure you want to delete user/i),
      });
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();
    },
    expectUserRole: async (username: string, role: string) => {
      const row = container.getByRole('row', { name: new RegExp(username, 'i') });
      await expect(row.getByText(new RegExp(role, 'i'))).toBeVisible();
    },
    openResetPasswordDialog: async (username: string) => {
      const row = container.getByRole('row', { name: new RegExp(username, 'i') });
      await row.getByRole('button', { name: /Reset password/i }).click();
      const resetDialog = page.getByRole('dialog', { name: /Reset Password/i });
      await expect(resetDialog).toBeVisible();
    },
    submitResetPassword: async ({
      newPassword,
      confirmPassword,
    }: {
      newPassword: string;
      confirmPassword: string;
    }) => {
      const resetDialog = page.getByRole('dialog', { name: /Reset Password/i });
      await resetDialog.getByLabel('New Password', { exact: true }).fill(newPassword);
      await resetDialog.getByLabel('Confirm New Password', { exact: true }).fill(confirmPassword);
      await resetDialog.getByRole('button', { name: 'Reset Password' }).click();
    },
    expectResetPasswordError: async (message: string | RegExp) => {
      const resetDialog = page.getByRole('dialog', { name: /Reset Password/i });
      await expect(resetDialog.getByText(message)).toBeVisible();
    },
    expectResetPasswordDialogClosed: async () => {
      const resetDialog = page.getByRole('dialog', { name: /Reset Password/i });
      await expect(resetDialog).not.toBeVisible();
    },
  };
};
