import { adminUserFixture } from './mockFixtures';
import { createMockState } from './mockState';

const jsonResponse = async (route, body, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const notFound = async (route, message) => {
  await jsonResponse(route, { error: message }, 404);
};

export const installMockApi = async (page) => {
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

    if (path === '/api/products' && method === 'GET') {
      await jsonResponse(route, { data: state.getProducts() });
      return;
    }

    if (path === '/api/products' && method === 'POST') {
      await jsonResponse(route, { data: state.createProduct(request.postDataJSON()) });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'PUT') {
      const productId = path.split('/').pop();
      const updated = state.updateProduct(productId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: updated });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'DELETE') {
      const productId = path.split('/').pop();
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
      const product = state.getProductById(path.split('/').pop());
      if (!product) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: product });
      return;
    }

    if (path.startsWith('/api/products/') && method === 'GET') {
      const key = decodeURIComponent(path.split('/').pop());
      const product = state.getProductByBarcode(key) || state.getProductById(key);
      if (!product) {
        await notFound(route, 'Product not found');
        return;
      }
      await jsonResponse(route, { data: product, product });
      return;
    }

    if (path.startsWith('/api/batches/') && method === 'PUT') {
      const batchId = path.split('/').pop();
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
      const sale = state.getSaleById(path.split('/').pop());
      if (!sale) {
        await notFound(route, 'Sale not found');
        return;
      }
      await jsonResponse(route, sale);
      return;
    }

    if (path.endsWith('/return') && path.startsWith('/api/sale/') && method === 'POST') {
      const saleId = path.split('/')[3];
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
      await jsonResponse(route, []);
      return;
    }

    if (path === '/api/reports/low-stock' && method === 'GET') {
      await jsonResponse(route, state.getProducts());
      return;
    }

    if (path === '/api/reports/loose-sales' && method === 'GET') {
      await jsonResponse(route, state.getLooseSales());
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
      const expenseId = path.split('/').pop();
      const updated = state.updateExpense(expenseId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Expense not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/expenses/') && method === 'DELETE') {
      const expenseId = path.split('/').pop();
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
      const purchaseId = path.split('/').pop();
      const updated = state.updatePurchase(purchaseId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Purchase not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/purchases/') && method === 'DELETE') {
      const purchaseId = path.split('/').pop();
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
      const promotionId = path.split('/').pop();
      const updated = state.updatePromotion(promotionId, request.postDataJSON());
      if (!updated) {
        await notFound(route, 'Promotion not found');
        return;
      }
      await jsonResponse(route, updated);
      return;
    }

    if (path.startsWith('/api/promotions/') && method === 'DELETE') {
      const promotionId = path.split('/').pop();
      const removed = state.deletePromotion(promotionId);
      if (!removed) {
        await notFound(route, 'Promotion not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path.startsWith('/api/loose-sales/') && method === 'DELETE') {
      const saleId = path.split('/').pop();
      const removed = state.deleteLooseSale(saleId);
      if (!removed) {
        await notFound(route, 'Loose sale not found');
        return;
      }
      await jsonResponse(route, { success: true });
      return;
    }

    if (path.startsWith('/api/promotions/product-options/') && method === 'GET') {
      const product = state.getProductById(path.split('/').pop());
      await jsonResponse(route, {
        mrp: product?.batches?.[0]?.mrp || 110,
        costPrice: product?.costPrice || 78,
        sellingPrice: product?.sellingPrice || 95,
      });
      return;
    }

    if (method === 'GET') {
      await jsonResponse(route, { data: [] });
      return;
    }

    await jsonResponse(route, { success: true, data: {} });
  });
};