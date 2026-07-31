import { expect, type Page } from '@playwright/test';

export const createUsersPage = (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'User Management' });

  return {
    expectLoaded: async () => {
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Add User' })).toBeVisible();
    },
    openAddUserDialog: async () => {
      await dialog.getByRole('button', { name: 'Add User' }).click();
      const addDialog = page.getByRole('dialog', { name: 'Add New User' });
      await expect(addDialog).toBeVisible();
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
      const addDialog = page.getByRole('dialog', { name: 'Add New User' });
      await addDialog.getByRole('textbox', { name: 'Username' }).fill(username);
      await addDialog.getByLabel('Password').fill(password);
      await addDialog.getByRole('combobox', { name: 'Role' }).click();
      await page.getByRole('option', { name: new RegExp(role, 'i') }).click();
      await addDialog.getByRole('button', { name: 'Add User' }).click();
      await expect(addDialog).not.toBeVisible({ timeout: 10000 });
    },
    expectUserVisible: async (username: string) => {
      await expect(dialog.getByRole('cell', { name: username })).toBeVisible();
    },
    expectUserNotVisible: async (username: string) => {
      await expect(dialog.getByRole('cell', { name: username })).not.toBeVisible();
    },
    openEditUserDialog: async (username: string) => {
      const row = dialog.getByRole('row', { name: new RegExp(username, 'i') });
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
      const row = dialog.getByRole('row', { name: new RegExp(username, 'i') });
      await row.getByRole('button', { name: /Delete user/i }).click();

      const confirmDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText(/Are you sure you want to delete user/i),
      });
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.getByRole('button', { name: 'Yes' }).click();
    },
    expectUserRole: async (username: string, role: string) => {
      const row = dialog.getByRole('row', { name: new RegExp(username, 'i') });
      await expect(row.getByText(new RegExp(role, 'i'))).toBeVisible();
    }
  };
};
