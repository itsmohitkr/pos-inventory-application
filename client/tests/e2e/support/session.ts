import { expect, type Page } from '@playwright/test';

export const clearBrowserStorage = async (page: Page) => {
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

export const loginAsAdmin = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByText('POS System Login')).toBeVisible();
  await page.getByLabel('Username').fill('admin');
  // exact: true — the show/hide toggle on this field has an aria-label
  // containing "password" too, which a substring match would also resolve.
  await page.getByLabel('Password', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Log In' }).click();
};
