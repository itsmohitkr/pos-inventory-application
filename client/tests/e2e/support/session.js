import { expect } from '@playwright/test';

export const clearBrowserStorage = async (page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};

export const loginAsAdmin = async (page) => {
  await page.goto('/');
  await expect(page.getByText('POS System Login')).toBeVisible();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Log In' }).click();
};
