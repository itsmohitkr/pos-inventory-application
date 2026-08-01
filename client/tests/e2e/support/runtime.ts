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
    if (!response.url().includes('/api/') || response.status() < 400) return;

    // GET /api/products/:barcode is the barcode-uniqueness check (see
    // useAddProductForm's addBarcode): a 404 there means "no existing
    // product with this barcode", which is the expected, handled signal
    // that a freshly generated barcode is safe to use — not an app error.
    const isExpectedBarcodeUniquenessCheck =
      response.status() === 404 &&
      response.request().method() === 'GET' &&
      /\/api\/products\/\d+$/.test(new URL(response.url()).pathname);
    if (isExpectedBarcodeUniquenessCheck) return;

    failedApiResponses.push(`${response.status()} ${response.url()}`);
  });

  return { pageErrors, failedApiResponses };
};

export const expectHealthyPage = async (page: Page, failures: RuntimeFailures) => {
  await expect(page.getByText('Something Went Wrong')).toHaveCount(0);
  expect(failures.failedApiResponses, failures.failedApiResponses.join('\n')).toEqual([]);
  expect(failures.pageErrors, failures.pageErrors.join('\n')).toEqual([]);
};
