import { expect } from '@playwright/test';

export const clearBrowserStorage = async (page) => {
  // Ensure we are on the application's domain before clearing localStorage to avoid SecurityError
  if (page.url() === 'about:blank') {
    await page.goto('/');
  }
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
  });
};

export const loginAsAdmin = async (page) => {
  await page.goto('/');
  await expect(page.getByText('POS System Login')).toBeVisible();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Log In' }).click();
};
