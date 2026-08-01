import type { Page, Route } from '@playwright/test';
import { adminUserFixture } from './mockFixtures';
import { createMockState } from './mockState';

const jsonResponse = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const notFound = async (route: Route, message: string) => {
  await jsonResponse(route, { error: message }, 404);
};

// Every call site below only reaches `.pop()` after a `path.startsWith(...)`
// check has already matched a `/segment/<id>` route, so the final segment is
// always present — this just gives that guarantee a name instead of an
// `as string` at each of the ~15 call sites.
const lastSegment = (path: string): string => path.split('/').pop() as string;

export const installMockApi = async (page: Page) => {
  const state = createMockState();

  await page.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    if (!path.startsWith('/api/')) {
      await route.continue();
      return;
    }

    if (path === '/api/auth/login' && method === 'POST') {
      await jsonResponse(route, adminUserFixture);
      return;
    }

    if (path === '/api/settings' && method === 'GET') {
      await jsonResponse(route, state.getSettings());
      return;
    }

    if (path === '/api/settings' && method === 'POST') {
      await jsonResponse(route, state.updateSettings(request.postDataJSON()));
      return;
    }

    if (path === '/api/settings/printers' && method === 'GET') {
      await jsonResponse(route, { data: [] });
      return;
    }

    if (path === '/api/auth/users' && method === 'GET') {
      await jsonResponse(route, state.getUsers());
      return;
    }

    if (path === '/api/auth/users' && method === 'POST') {
      await jsonResponse(route, state.createUser(request.postDataJSON()));
      return;
    }

    if (path.startsWith('/api/auth/users/') && method === 'PUT') {
      const userId = lastSegment(path);
      await jsonResponse(route, state.updateUser(userId, request.postDataJSON()));
      return;
    }

    if (path.startsWith('/api/auth/users/') && method === 'DELETE') {
      const userId = lastSegment(path);
      await jsonResponse(route, { success: state.deleteUser(userId) });
      return;
    }

    if (path === '/api/products' && method === 'GET') {
      await jsonResponse(route, { data: state.getProducts() });
      return;
    }

    if (path === '/api/products' && method === 'POST') {
      await jsonResponse(route, { data: state.createProduct(request.postDataJSON()) });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'PUT') {
      const productId = lastSegment(path);
      const updated = state.updateProduct(productId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: updated });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'DELETE') {
      const productId = lastSegment(path);
      const removed = state.deleteProduct(productId);
      if (!removed) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path === '/api/products/summary' && method === 'GET') {
      await jsonResponse(route, { data: state.getProductSummary() });
      return;
    }

    if (path === '/api/categories' && method === 'GET') {
      await jsonResponse(route, { data: state.getCategoryTree() });
      return;
    }

    if (path.startsWith('/api/products/id/') && method === 'GET') {
      const product = state.getProductById(lastSegment(path));
      if (!product) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: product });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'GET') {
      const key = decodeURIComponent(lastSegment(path));
      const product = state.getProductByBarcode(key) || state.getProductById(key);
      if (!product) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: product, product });
      return;
    }

    if (path.startsWith('/api/batches/') && method === 'PUT') {
      const batchId = lastSegment(path);
      const updated = state.updateBatch(batchId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Batch not found');
        return;
      }
      await jsonResponse(route, { data: updated });
      return;
    }

    if (path === '/api/sale' && method === 'POST') {
      const sale = state.processSale(request.postDataJSON());
      await jsonResponse(route, sale);
      return;
    }

    if (path.startsWith('/api/sale/') && method === 'GET') {
      const sale = state.getSaleById(lastSegment(path));
      if (!sale) {
        await notFound(route, 'Sale not found');
        return;
      }
      await jsonResponse(route, sale);
      return;
    }

    if (path.endsWith('/return') && path.startsWith('/api/sale/') && method === 'POST') {
      const saleId = path.split('/')[3] as string;
      const refundResult = state.processRefund(saleId, request.postDataJSON()?.items || []);
      if (!refundResult) {
        await notFound(route, 'Sale not found');
        return;
      }
      await jsonResponse(route, refundResult);
      return;
    }

    if (path === '/api/reports' && method === 'GET') {
      await jsonResponse(route, state.getPeriodicReport());
      return;
    }

    if (path === '/api/reports/monthly' && method === 'GET') {
      await jsonResponse(route, state.getMonthlyReport());
      return;
    }

    if (path === '/api/reports/daily' && method === 'GET') {
      await jsonResponse(route, state.getDailyReport());
      return;
    }

    if (path === '/api/reports/expiry' && method === 'GET') {
      const { startDate, endDate } = Object.fromEntries(new URL(request.url()).searchParams);
      await jsonResponse(route, state.getExpiryReport({ startDate, endDate }));
      return;
    }

    if (path === '/api/reports/low-stock' && method === 'GET') {
      await jsonResponse(route, state.getLowStockReport());
      return;
    }

    if (path === '/api/reports/top-selling' && method === 'GET') {
      await jsonResponse(route, {});
      return;
    }

    if (path === '/api/reports/loose-sales' && method === 'GET') {
      await jsonResponse(route, state.getLooseSales());
      return;
    }

    if (path === '/api/loose-sales' && method === 'POST') {
      await jsonResponse(route, state.createLooseSale(request.postDataJSON()));
      return;
    }

    if (path === '/api/expenses' && method === 'GET') {
      await jsonResponse(route, state.getExpenses());
      return;
    }

    if (path === '/api/expenses' && method === 'POST') {
      await jsonResponse(route, state.createExpense(request.postDataJSON()));
      return;
    }

    if (path.startsWith('/api/expenses/') && method === 'PUT') {
      const expenseId = lastSegment(path);
      const updated = state.updateExpense(expenseId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Expense not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/expenses/') && method === 'DELETE') {
      const expenseId = lastSegment(path);
      const removed = state.deleteExpense(expenseId);
      if (!removed) {
        await notFound(route, 'Expense not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path === '/api/purchases' && method === 'GET') {
      await jsonResponse(route, state.getPurchases());
      return;
    }

    if (path === '/api/purchases' && method === 'POST') {
      await jsonResponse(route, state.createPurchase(request.postDataJSON()));
      return;
    }

    if (path.startsWith('/api/purchases/') && method === 'PUT') {
      const purchaseId = lastSegment(path);
      const updated = state.updatePurchase(purchaseId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Purchase not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/purchases/') && method === 'DELETE') {
      const purchaseId = lastSegment(path);
      const removed = state.deletePurchase(purchaseId);
      if (!removed) {
        await notFound(route, 'Purchase not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path === '/api/promotions' && method === 'GET') {
      await jsonResponse(route, state.getPromotions());
      return;
    }

    if (path === '/api/promotions' && method === 'POST') {
      await jsonResponse(route, state.createPromotion(request.postDataJSON()));
      return;
    }

    if (path.startsWith('/api/promotions/') && method === 'PUT') {
      const promotionId = lastSegment(path);
      const updated = state.updatePromotion(promotionId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Promotion not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path === '/api/customers' && method === 'GET') {
      await jsonResponse(route, { customers: state.getCustomers(), total: state.getCustomers().length });
      return;
    }

    if (path.startsWith('/api/customers/') && path.endsWith('/history') && method === 'GET') {
      const customerId = path.split('/')[3] as string;
      const history = state.getCustomerHistory(customerId);
      if (!history) {
        await notFound(route, 'Customer not found');
        return;
      }
      await jsonResponse(route, history);
      return;
    }

    if (path.startsWith('/api/customers/') && method === 'GET') {
      const customer = state.getCustomerById(lastSegment(path));
      if (!customer) {
        await notFound(route, 'Customer not found');
        return;
      }
      await jsonResponse(route, customer);
      return;
    }

    if (path.startsWith('/api/customers/') && method === 'PUT') {
      const customerId = lastSegment(path);
      const updated = state.updateCustomer(customerId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Customer not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/promotions/') && method === 'DELETE') {
      const promotionId = lastSegment(path);
      const removed = state.deletePromotion(promotionId);
      if (!removed) {
        await notFound(route, 'Promotion not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path.startsWith('/api/loose-sales/') && method === 'DELETE') {
      const saleId = lastSegment(path);
      const removed = state.deleteLooseSale(saleId);
      if (!removed) {
        await notFound(route, 'Loose sale not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path.startsWith('/api/promotions/product-options/') && method === 'GET') {
      const product = state.getProductById(lastSegment(path));
      await jsonResponse(route, {
        mrp: product?.batches?.[0]?.mrp || 110,
        costPrice: product?.costPrice || 78,
        sellingPrice: product?.sellingPrice || 95,
      });
      return;
    }

    if (path === '/api/category-sales/preview' && method === 'GET') {
      const searchParams = new URL(request.url()).searchParams;
      const category = searchParams.get('category') || '';
      const discountPercentage = Number(searchParams.get('discountPercentage') || 0);
      await jsonResponse(route, state.previewCategorySaleProducts(category, discountPercentage));
      return;
    }

    if (path === '/api/category-sales' && method === 'GET') {
      await jsonResponse(route, state.getCategorySales());
      return;
    }

    if (path === '/api/category-sales' && method === 'POST') {
      await jsonResponse(route, state.createCategorySale(request.postDataJSON()));
      return;
    }

    if (path.match(/^\/api\/category-sales\/\d+\/status$/) && method === 'PATCH') {
      const saleId = path.split('/')[3] as string;
      const updated = state.toggleCategorySaleStatus(saleId, request.postDataJSON().status);
      if (!updated) {
        await notFound(route, 'Category sale not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/category-sales/') && method === 'PUT') {
      const saleId = lastSegment(path);
      const updated = state.updateCategorySale(saleId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Category sale not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/category-sales/') && method === 'DELETE') {
      const saleId = lastSegment(path);
      const removed = state.deleteCategorySale(saleId);
      if (!removed) {
        await notFound(route, 'Category sale not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (method === 'GET') {
      await jsonResponse(route, { data: [] });
      return;
    }

    await jsonResponse(route, { success: true, data: {} });
  });
};
