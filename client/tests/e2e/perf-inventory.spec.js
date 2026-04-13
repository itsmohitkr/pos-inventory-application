/**
 * Inventory Performance Measurement Spec
 *
 * Usage:
 *   cd client
 *   PERF=1 npx playwright test tests/e2e/perf-inventory.spec.js --project=chromium --reporter=list
 *
 * By default this spec is skipped so it does not affect the normal test suite.
 * Set PERF=1 to run it.  All API calls are mocked so no server is required.
 * A simulated 80 ms API delay per call models a realistic LAN backend.
 */

// @ts-check
import { test, expect } from '@playwright/test';
import process from 'node:process';
import { adminUserFixture, settingsFixture } from './support/mockFixtures';

// ─── constants ─────────────────────────────────────────────────────────────
const PRODUCT_COUNT = 300;
const MOCK_API_DELAY_MS = 80; // simulated backend latency per call
const RUNS = 3; // repeat each interaction and take the median
const CATEGORIES = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Personal Care', 'Household'];

/**
 * @typedef {Object} ProductBatch
 * @property {number} id
 * @property {string} batchCode
 * @property {string} batchNumber
 * @property {number} quantity
 * @property {number} costPrice
 * @property {number} sellingPrice
 * @property {number} mrp
 * @property {string | null} expiryDate
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string} barcode
 * @property {string} category
 * @property {boolean} batchTrackingEnabled
 * @property {boolean} lowStockWarningEnabled
 * @property {number} lowStockThreshold
 * @property {number} total_stock
 * @property {number} totalQuantity
 * @property {number} costPrice
 * @property {number} sellingPrice
 * @property {number} mrp
 * @property {boolean} isDeleted
 * @property {ProductBatch[]} batches
 */

// ─── data generators ───────────────────────────────────────────────────────
/**
 * @param {number} count 
 * @returns {Product[]}
 */
function generateProducts(count) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const category = CATEGORIES[i % CATEGORIES.length];
    const stock = 10 + (i % 150);
    const cp = 50 + (i % 100);
    const sp = 80 + (i % 150);
    const mrp = 100 + (i % 200);
    return {
      id,
      name: `${category} Item ${String(id).padStart(4, '0')}`,
      barcode: `890${String(id).padStart(10, '0')}`,
      category,
      batchTrackingEnabled: id % 4 === 0,
      lowStockWarningEnabled: id % 6 === 0,
      lowStockThreshold: 10,
      total_stock: stock,
      totalQuantity: stock,
      costPrice: cp,
      sellingPrice: sp,
      mrp,
      isDeleted: false,
      batches: [
        {
          id: id * 10,
          batchCode: `BATCH-${id}`,
          batchNumber: `BATCH-${id}`,
          quantity: stock,
          costPrice: cp,
          sellingPrice: sp,
          mrp,
          expiryDate: null,
        },
      ],
    };
  });
}

/**
 * @param {Product[]} products 
 */
function buildSummary(products) {
  /** @type {Record<string, number>} */
  const cats = {};
  const totals = products.reduce(
    (/** @type {{ productCount: number, totalQty: number, totalCost: number, totalSelling: number, totalMrp: number }} */ acc, p) => {
      cats[p.category] = (cats[p.category] || 0) + 1;
      return {
        productCount: acc.productCount + 1,
        totalQty: acc.totalQty + p.totalQuantity,
        totalCost: acc.totalCost + p.totalQuantity * p.costPrice,
        totalSelling: acc.totalSelling + p.totalQuantity * p.sellingPrice,
        totalMrp: acc.totalMrp + p.totalQuantity * p.mrp,
      };
    },
    { productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0, totalMrp: 0 }
  );
  return { totals, categoryCounts: cats, uncategorizedCount: 0, totalCount: products.length };
}

function buildCategoryTree() {
  return CATEGORIES.map((cat) => ({
    id: cat.toLowerCase().replace(/\s+/g, '-'),
    name: cat,
    path: cat,
    children: [],
  }));
}

// ─── mock API installer ─────────────────────────────────────────────────────
/**
 * @param {import('@playwright/test').Page} page 
 * @param {Product[]} products 
 */
async function installPerfMock(page, products) {
  const summary = buildSummary(products);
  const catTree = buildCategoryTree();
  /** @type {Map<number, Product>} */
  const productMap = new Map(products.map((p) => [p.id, p]));
  const delay = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

  await page.route('**/*', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;

    /**
     * @param {any} body 
     * @param {number} [status] 
     */
    const json = async (body, status = 200) => {
      await delay(MOCK_API_DELAY_MS);
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    if (!path.startsWith('/api/')) return route.continue();

    if (path === '/api/auth/login' && method === 'POST') return json(adminUserFixture);
    if (path === '/api/settings' && method === 'GET') return json(settingsFixture);
    if (path === '/api/settings/printers') return json({ data: [] });
    if (path === '/api/categories') return json({ data: catTree });
    if (path === '/api/products/summary') return json({ data: summary });
    if (path === '/api/products' && method === 'GET') return json({ data: products });

    if (path.startsWith('/api/products/id/')) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      const product = productMap.get(id);
      return product ? json({ data: product }) : json({ error: 'Not found' }, 404);
    }

    return json({ data: [] });
  });
}

// ─── helpers ────────────────────────────────────────────────────────────────
/**
 * @param {number[]} arr 
 */
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * @typedef {Object} PerfResult
 * @property {string} label
 * @property {number[]} times
 */

/**
 * @param {PerfResult[]} results 
 */
function printReport(results) {
  const COL_LABEL = 42;
  const line = '─'.repeat(COL_LABEL + 28);
  const rows = results.map(({ label, times }) => {
    const med = median(times);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const bar = '█'.repeat(Math.min(20, Math.round(med / 25)));
    return { label, med, min, max, bar };
  });

  const lines = [
    '',
    `┌${line}┐`,
    `│  INVENTORY PERFORMANCE  (${PRODUCT_COUNT} products · ${MOCK_API_DELAY_MS}ms mock API delay · ${RUNS} runs each)${' '.repeat(Math.max(0, line.length - 68))}│`,
    `├${line}┤`,
    `│  ${'Metric'.padEnd(COL_LABEL)}${'Median'.padStart(7)}${'Min'.padStart(7)}${'Max'.padStart(7)}   ${''.padEnd(20)}│`,
    `├${line}┤`,
    ...rows.map(
      ({ label, med, min, max, bar }) =>
        `│  ${label.padEnd(COL_LABEL)}${`${med}ms`.padStart(7)}${`${min}ms`.padStart(7)}${`${max}ms`.padStart(7)}   ${bar.padEnd(20)}│`
    ),
    `└${line}┘`,
    '',
    `  Note: Median includes ${MOCK_API_DELAY_MS}ms simulated API latency per call.`,
    `  React render/filter time ≈ Median − ${MOCK_API_DELAY_MS}ms (for API-dependent actions).`,
    `  Category filter and row de-select are purely local — no API call.`,
    '',
  ];

  console.log(lines.join('\n'));
}

// ─── spec ───────────────────────────────────────────────────────────────────
test.describe.configure({ mode: 'serial' });

test('inventory interaction timings', async ({ page }) => {
  test.skip(!process.env.PERF, 'Set PERF=1 to run: PERF=1 npx playwright test perf-inventory --project=chromium --reporter=list');
  test.setTimeout(120_000);

  // ── setup ──────────────────────────────────────────────────────────────
  const products = generateProducts(PRODUCT_COUNT);

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await installPerfMock(page, products);

  await page.goto('/');
  await expect(page.getByText('POS System Login')).toBeVisible();
  await page.getByLabel('Admin Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login as Admin' }).click();

  // common locators
  const firstRow = page.locator('table tbody tr').nth(0);
  const detailPanel = page.getByTestId('inventory-detail-panel');
  const inventoryLink = page.getByRole('link', { name: 'Inventory' });
  const posLink = page.getByRole('link', { name: 'POS' });
  const resetButton = page.getByRole('button', { name: /Reset/i });
  const posBar = page.locator('input[placeholder*="name, barcode or price"]').first();

  /** @type {PerfResult[]} */
  const results = [];

  // ── 1. Inventory tab load ──────────────────────────────────────────────
  {
    const times = [];
    for (let r = 0; r < RUNS; r++) {
      await posLink.click();
      await expect(posBar).toBeVisible({ timeout: 10_000 });

      const t0 = Date.now();
      await inventoryLink.click();
      await expect(firstRow).toBeVisible({ timeout: 20_000 });
      times.push(Date.now() - t0);
    }
    results.push({ label: 'Inventory tab load  (click → rows visible)', times });
  }

  // ── 2. Row click → detail panel opens ─────────────────────────────────
  {
    // start with no row selected
    if (await detailPanel.isVisible()) {
      await resetButton.click();
      await expect(detailPanel).not.toBeVisible({ timeout: 5_000 });
    }
    await expect(firstRow).toBeVisible();

    const times = [];
    for (let r = 0; r < RUNS; r++) {
      const t0 = Date.now();
      await firstRow.click({ force: true });
      await expect(detailPanel).toBeVisible({ timeout: 10_000 });
      times.push(Date.now() - t0);

      // close via Reset (deterministic – no race conditions)
      await resetButton.click();
      await expect(detailPanel).not.toBeVisible({ timeout: 5_000 });
    }
    results.push({ label: 'Row click  → detail panel opens', times });
  }

  // ── 3. Search filter (local JS – no API call) ──────────────────────────
  {
    await expect(firstRow).toBeVisible();
    const searchInput = page.locator('input[placeholder*="Search name"]');
    const clearBtn = page.locator('svg[data-testid="ClearIcon"]').locator('..').locator('..').first();
    const times = [];

    for (let r = 0; r < RUNS; r++) {
      if (await clearBtn.isVisible()) await clearBtn.click();
      await expect(firstRow).toBeVisible({ timeout: 5_000 });

      const t0 = Date.now();
      await searchInput.fill('Beverages'); // ~50 of 300 products match
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 5_000 });
      times.push(Date.now() - t0);

      await searchInput.fill('');
      await expect(firstRow).toBeVisible({ timeout: 5_000 });
    }
    results.push({ label: 'Search filter  (type → results visible)', times });
  }

  // ── 4. Category filter switch (local JS – no API call) ─────────────────
  {
    // ensure All Categories is active
    const allCatBtn = page.locator('[role="button"]').filter({ hasText: 'All Categories' }).first();
    const bevBtn = page.locator('[role="button"]').filter({ hasText: /^Beverages/ }).first();
    await allCatBtn.click();
    await expect(firstRow).toBeVisible({ timeout: 5_000 });

    const times = [];
    for (let r = 0; r < RUNS; r++) {
      const t0 = Date.now();
      await bevBtn.click();
      await expect(firstRow).toBeVisible({ timeout: 5_000 });
      times.push(Date.now() - t0);

      // back to All for next run
      await allCatBtn.click();
      await expect(firstRow).toBeVisible({ timeout: 5_000 });
    }
    results.push({ label: 'Category filter  (All → Beverages)', times });
  }

  // ── 5. Tab switch away (Inventory → POS) ──────────────────────────────
  {
    await inventoryLink.click();
    await expect(firstRow).toBeVisible({ timeout: 20_000 });

    const times = [];
    for (let r = 0; r < RUNS; r++) {
      const t0 = Date.now();
      await posLink.click();
      await expect(posBar).toBeVisible({ timeout: 10_000 });
      times.push(Date.now() - t0);

      if (r < RUNS - 1) {
        await inventoryLink.click();
        await expect(firstRow).toBeVisible({ timeout: 20_000 });
      }
    }
    results.push({ label: 'Tab switch  Inventory → POS', times });
  }

  // ── 6. Tab switch back (POS → Inventory) ──────────────────────────────
  {
    // ensure on POS
    if (!(await posBar.isVisible())) {
      await posLink.click();
      await expect(posBar).toBeVisible({ timeout: 10_000 });
    }

    const times = [];
    for (let r = 0; r < RUNS; r++) {
      const t0 = Date.now();
      await inventoryLink.click();
      await expect(firstRow).toBeVisible({ timeout: 20_000 });
      times.push(Date.now() - t0);

      if (r < RUNS - 1) {
        await posLink.click();
        await expect(posBar).toBeVisible({ timeout: 10_000 });
      }
    }
    results.push({ label: 'Tab switch  POS → Inventory', times });
  }

  // ── print report ───────────────────────────────────────────────────────
  printReport(results);

  // Attach results to the Playwright HTML report as well
  const text = results
    .map(({ label, times }) => `${label}: median=${median(times)}ms  min=${Math.min(...times)}ms  max=${Math.max(...times)}ms`)
    .join('\n');
  await test.info().attach('performance-results.txt', { body: text, contentType: 'text/plain' });
});
