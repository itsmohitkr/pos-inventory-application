import { expect, type Page } from '@playwright/test';

interface ShopMetadataFields {
  name?: string;
  mobile?: string;
  address?: string;
  email?: string;
  gst?: string;
}

export const createSettingsPage = (page: Page) => {
  const container = page.locator('[data-testid="store-settings-page"], [role="dialog"]').filter({
    has: page.getByRole('tab', { name: 'Payment' }),
  });

  return {
    expectLoaded: async () => {
      await expect(container.getByRole('tab', { name: 'Account' })).toBeVisible();
      await expect(container.getByRole('tab', { name: 'Payment' })).toBeVisible();
    },
    openPaymentSettingsTab: async () => {
      await container.getByRole('tab', { name: 'Payment' }).click();
      await expect(container.getByRole('heading', { name: 'Payment Settings' })).toBeVisible();
    },
    togglePaymentMethod: async (label: string) => {
      await container.getByRole('checkbox', { name: new RegExp(label, 'i') }).click();
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Success', { exact: true }),
      });
      if (await successDialog.count()) {
        await successDialog.getByRole('button', { name: 'OK' }).click();
      }
    },
    expectPaymentMethodChecked: async (label: string, checked: boolean) => {
      const checkbox = container.getByRole('checkbox', { name: new RegExp(label, 'i') });
      if (checked) {
        await expect(checkbox).toBeChecked();
      } else {
        await expect(checkbox).not.toBeChecked();
      }
    },
    addCustomMethod: async (label: string) => {
      await container.getByRole('button', { name: 'Add Custom Method' }).click();
      await container.getByPlaceholder('Enter payment method name').fill(label);
      await container.getByRole('button', { name: 'Add' }).click();
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Success', { exact: true }),
      });
      if (await successDialog.count()) {
        await successDialog.getByRole('button', { name: 'OK' }).click();
      }
      await expect(container.getByText(label)).toBeVisible();
    },
    openAccountTab: async () => {
      await container.getByRole('tab', { name: 'Account' }).click();
      await expect(container.getByRole('heading', { name: 'Shop Information' })).toBeVisible();
    },
    updateShopMetadata: async ({ name, mobile, address, email, gst }: ShopMetadataFields) => {
      if (name) await container.getByLabel('Shop Name').fill(name);
      if (mobile) await container.getByLabel('Mobile Number 1').fill(mobile);
      if (email) await container.getByLabel('Email Address').fill(email);
      if (address) await container.getByLabel('Shop Address').fill(address);
      if (gst) await container.getByLabel('GST Number (Optional)').fill(gst);
      
      await container.getByRole('button', { name: 'Save Changes' }).click();
      
      const successDialog = page.locator('[role="dialog"]').filter({
        has: page.getByText('Settings saved successfully!', { exact: false }),
      });
      if (await successDialog.count()) {
        await successDialog.getByRole('button', { name: 'OK' }).click();
      }
    },
    verifyShopMetadata: async ({ name, mobile, address, email, gst }: ShopMetadataFields) => {
      if (name) await expect(container.getByLabel('Shop Name')).toHaveValue(name);
      if (mobile) await expect(container.getByLabel('Mobile Number 1')).toHaveValue(mobile);
      if (email) await expect(container.getByLabel('Email Address')).toHaveValue(email);
      if (address) await expect(container.getByLabel('Shop Address')).toHaveValue(address);
      if (gst) await expect(container.getByLabel('GST Number (Optional)')).toHaveValue(gst);
    }
  };
};
