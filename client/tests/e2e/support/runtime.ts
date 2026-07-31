import { expect, type Page } from '@playwright/test';

export interface RuntimeFailures {
  pageErrors: string[];
  failedApiResponses: string[];
}

export const collectRuntimeFailures = (page: Page): RuntimeFailures => {
  const pageErrors: string[] = [];
  const failedApiResponses: string[] = [];

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

export const expectHealthyPage = async (page: Page, failures: RuntimeFailures) => {
  await expect(page.getByText('Something Went Wrong')).toHaveCount(0);
  expect(failures.failedApiResponses, failures.failedApiResponses.join('\n')).toEqual([]);
  expect(failures.pageErrors, failures.pageErrors.join('\n')).toEqual([]);
};
