import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';

/** Per-call axios options — used throughout for AbortController signals. */
type RequestConfig = AxiosRequestConfig;

/** Query params forwarded to axios `params`. */
type QueryParams = Record<string, unknown>;

/**
 * Loosely typed request bodies. The server accepts snake_case keys that do not
 * match the Prisma models, so precise shapes wait until the server domains are
 * converted. TODO(ts-migration): tighten once server/src/domains is typed.
 */
type RequestBody = Record<string, unknown>;

/**
 * One cart line. Mirrors saleItemSchema in
 * server/src/domains/sale/sale.validation.js.
 *
 * `quantity` must be a whole number — Batch.quantity and SaleItem.quantity are
 * Int columns, and the server rejects fractional values with a 400. Goods sold
 * by weight go through createLooseSale instead.
 */
export interface SaleItemPayload {
  batch_id: number | string;
  quantity: number;
  sellingPrice: number;
  isFree?: boolean;
  /** The buy-X-get-free threshold amount that earned this gift, only meaningful when isFree. */
  freeGiftThresholdAmount?: number | null;
}

/**
 * Body for POST /api/sale.
 *
 * The server rejects `discount + extraDiscount` exceeding the cart total rather
 * than silently clamping it to zero.
 */
export interface ProcessSalePayload {
  items: SaleItemPayload[];
  discount?: number;
  extraDiscount?: number;
  paymentMethod?: string;
  /** Accepted by validation but not persisted by the server today. */
  paymentDetails?: string | Record<string, unknown> | null;
  customerId?: number | null;
}

/** One line of a refund request for POST /api/sale/:id/return. */
export interface RefundItemPayload {
  saleItemId: number;
  quantity: number;
}

/** Response shape of POST /api/sale/:id/return — mirrors server's ReturnResult. */
export interface RefundResult {
  message: string;
  totalRefunded: number;
}

/**
 * POS Service
 * Centralizes all sales and transaction related API calls.
 */
const posService = {
  /**
   * Process a new sale
   */
  processSale: async (saleData: ProcessSalePayload, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.SALE_PROCESS, saleData);
    }
    const response = await api.post('/api/sale', saleData, config);
    return response.data;
  },

  /**
   * Fetch a specific sale by ID
   */
  fetchSaleById: async (id: number | string, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.SALE_GET_BY_ID, { id });
    }
    const response = await api.get(`/api/sale/${id}`, config);
    return response.data;
  },

  /**
   * Fetch sales history
   */
  fetchSalesHistory: async (params?: QueryParams, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_REPORTS, params);
    }
    const response = await api.get('/api/reports', { ...config, params });
    return response.data;
  },

  /**
   * Process a refund
   */
  processRefund: async (
    saleId: number,
    items: RefundItemPayload[],
    config: RequestConfig = {}
  ): Promise<RefundResult> => {
    if (isElectronProd) {
      return invokeIpc(IPC.SALE_PROCESS_RETURN, { id: saleId, items });
    }
    const response = await api.post(`/api/sale/${saleId}/return`, { items }, config);
    return response.data;
  },

  /**
   * Promotions: Fetch all promotions
   */
  fetchPromotions: async (config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PROMOTION_GET_ALL);
    }
    const response = await api.get('/api/promotions', config);
    return response.data;
  },

  /**
   * Promotions: Create a new promotion
   */
  createPromotion: async (promoData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PROMOTION_CREATE, promoData);
    }
    const response = await api.post('/api/promotions', promoData, config);
    return response.data;
  },

  /**
   * Promotions: Update an existing promotion
   */
  updatePromotion: async (id: number, promoData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PROMOTION_UPDATE, { id, ...promoData });
    }
    const response = await api.put(`/api/promotions/${id}`, promoData, config);
    return response.data;
  },

  /**
   * Promotions: Delete a promotion
   */
  deletePromotion: async (id: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PROMOTION_DELETE, { id });
    }
    const response = await api.delete(`/api/promotions/${id}`, config);
    return response.data;
  },

  /**
   * Promotions: Fetch pricing options for a product in promotions context
   */
  fetchPromotionProductOptions: async (productId: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PROMOTION_GET_PRODUCT_PRICING_OPTIONS, { productId });
    }
    const response = await api.get(`/api/promotions/product-options/${productId}`, config);
    return response.data;
  },

  /**
   * Expenses: Fetch expenses with optional filters
   */
  fetchExpenses: async (params?: QueryParams, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_GET_ALL, params);
    }
    const response = await api.get('/api/expenses', { ...config, params });
    return response.data;
  },

  /**
   * Expenses: Create a new expense
   */
  createExpense: async (expenseData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_CREATE, expenseData);
    }
    const response = await api.post('/api/expenses', expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Update an existing expense
   */
  updateExpense: async (id: number, expenseData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_UPDATE, { id, ...expenseData });
    }
    const response = await api.put(`/api/expenses/${id}`, expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Delete an expense
   */
  deleteExpense: async (id: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_DELETE, { id });
    }
    const response = await api.delete(`/api/expenses/${id}`, config);
    return response.data;
  },

  /**
   * Expense Payments: Add a payment to an expense
   */
  createExpensePayment: async (expenseId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_ADD_PAYMENT, { id: expenseId, ...paymentData });
    }
    const response = await api.post(`/api/expenses/${expenseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Update an expense payment
   */
  updateExpensePayment: async (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_UPDATE_PAYMENT, { id: paymentId, ...paymentData });
    }
    const response = await api.put(`/api/expenses/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Delete an expense payment
   */
  deleteExpensePayment: async (paymentId: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.EXPENSE_DELETE_PAYMENT, { id: paymentId });
    }
    const response = await api.delete(`/api/expenses/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Purchases: Fetch purchases with optional filters
   */
  fetchPurchases: async (params?: QueryParams, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_GET_ALL, params);
    }
    const response = await api.get('/api/purchases', { ...config, params });
    return response.data;
  },

  /**
   * Purchases: Create a new purchase
   */
  createPurchase: async (purchaseData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_CREATE, purchaseData);
    }
    const response = await api.post('/api/purchases', purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Update an existing purchase
   */
  updatePurchase: async (id: number, purchaseData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_UPDATE, { id, ...purchaseData });
    }
    const response = await api.put(`/api/purchases/${id}`, purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Delete a purchase
   */
  deletePurchase: async (id: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_DELETE, { id });
    }
    const response = await api.delete(`/api/purchases/${id}`, config);
    return response.data;
  },

  /**
   * Purchase Payments: Add a payment to a purchase
   */
  createPurchasePayment: async (purchaseId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_ADD_PAYMENT, { id: purchaseId, ...paymentData });
    }
    const response = await api.post(`/api/purchases/${purchaseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Update a purchase payment
   */
  updatePurchasePayment: async (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_UPDATE_PAYMENT, { id: paymentId, ...paymentData });
    }
    const response = await api.put(`/api/purchases/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Delete a purchase payment
   */
  deletePurchasePayment: async (paymentId: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.PURCHASE_DELETE_PAYMENT, { id: paymentId });
    }
    const response = await api.delete(`/api/purchases/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Loose Sales: Create a new loose sale
   */
  createLooseSale: async (saleData: RequestBody, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.LOOSE_SALE_CREATE, saleData);
    }
    const response = await api.post('/api/loose-sales', saleData, config);
    return response.data;
  },

  /**
   * Loose Sales: Delete a loose sale record
   */
  deleteLooseSale: async (id: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.LOOSE_SALE_DELETE, { id });
    }
    const response = await api.delete(`/api/loose-sales/${id}`, config);
    return response.data;
  },
};

export default posService;
