import { expect } from '@playwright/test';

export const collectRuntimeFailures = (page) => {
  const pageErrors = [];
  const failedApiResponses = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      failedApiResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return { pageErrors, failedApiResponses };
};

export const expectHealthyPage = async (page, failures) => {
  await expect(page.getByText('Something Went Wrong')).toHaveCount(0);
  expect(failures.failedApiResponses, failures.failedApiResponses.join('\n')).toEqual([]);
  expect(failures.pageErrors, failures.pageErrors.join('\n')).toEqual([]);
};