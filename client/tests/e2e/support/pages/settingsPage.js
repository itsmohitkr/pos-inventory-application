import { expect } from '@playwright/test';

export const createSettingsPage = (page) => {
  const dialog = page.locator('[role="dialog"]').filter({
    has: page.getByRole('tab', { name: 'Payment' }),
  });

  return {
    expectLoaded: async () => {
      await expect(dialog.getByRole('tab', { name: 'Account' })).toBeVisible();
      await expect(dialog.getByRole('tab', { name: 'Payment' })).toBeVisible();
    },
    openPaymentSettingsTab: async () => {
      await dialog.getByRole('tab', { name: 'Payment' }).click();
      await expect(dialog.getByRole('heading', { name: 'Payment Settings' })).toBeVisible();
    },
    togglePaymentMethod: async (label) => {
      await dialog.getByRole('checkbox', { name: new RegExp(label, 'i') }).click();
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Success', { exact: true }),
      });
      if (await successDialog.count()) {
        await successDialog.getByRole('button', { name: 'OK' }).click();
      }
    },
    expectPaymentMethodChecked: async (label, checked) => {
      const checkbox = dialog.getByRole('checkbox', { name: new RegExp(label, 'i') });
      if (checked) {
        await expect(checkbox).toBeChecked();
      } else {
        await expect(checkbox).not.toBeChecked();
      }
    },
    addCustomMethod: async (label) => {
      await dialog.getByRole('button', { name: 'Add Custom Method' }).click();
      await dialog.getByPlaceholder('Enter payment method name').fill(label);
      await dialog.getByRole('button', { name: 'Add' }).click();
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Success', { exact: true }),
      });
      if (await successDialog.count()) {
        await successDialog.getByRole('button', { name: 'OK' }).click();
      }
      await expect(dialog.getByText(label)).toBeVisible();
    },
  };
};
