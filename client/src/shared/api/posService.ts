import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { dualCall } from '@/shared/api/ipc';
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
  /** Set once the cashier has been warned about an expired batch and confirmed anyway. */
  allowExpiredItems?: boolean;
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
  processSale: (saleData: ProcessSalePayload, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.SALE_PROCESS, saleData, () => api.post('/api/sale', saleData, config)),

  /**
   * Fetch a specific sale by ID
   */
  fetchSaleById: (id: number | string, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.SALE_GET_BY_ID, { id }, () => api.get(`/api/sale/${id}`, config)),

  /**
   * Fetch sales history
   */
  fetchSalesHistory: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_REPORTS, params, () => api.get('/api/reports', { ...config, params })),

  /**
   * Process a refund
   */
  processRefund: (
    saleId: number,
    items: RefundItemPayload[],
    config: RequestConfig = {}
  ): Promise<RefundResult> =>
    dualCall(isElectronProd, IPC.SALE_PROCESS_RETURN, { id: saleId, items }, () =>
      api.post(`/api/sale/${saleId}/return`, { items }, config)
    ),

  /**
   * Promotions: Fetch all promotions
   */
  fetchPromotions: (config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PROMOTION_GET_ALL, undefined, () => api.get('/api/promotions', config)),

  /**
   * Promotions: Create a new promotion
   */
  createPromotion: (promoData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PROMOTION_CREATE, promoData, () => api.post('/api/promotions', promoData, config)),

  /**
   * Promotions: Update an existing promotion
   */
  updatePromotion: (id: number, promoData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PROMOTION_UPDATE, { id, ...promoData }, () =>
      api.put(`/api/promotions/${id}`, promoData, config)
    ),

  /**
   * Promotions: Delete a promotion
   */
  deletePromotion: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PROMOTION_DELETE, { id }, () => api.delete(`/api/promotions/${id}`, config)),

  /**
   * Promotions: Fetch pricing options for a product in promotions context
   */
  fetchPromotionProductOptions: (productId: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PROMOTION_GET_PRODUCT_PRICING_OPTIONS, { productId }, () =>
      api.get(`/api/promotions/product-options/${productId}`, config)
    ),

  /**
   * Expenses: Fetch expenses with optional filters
   */
  fetchExpenses: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_GET_ALL, params, () => api.get('/api/expenses', { ...config, params })),

  /**
   * Expenses: Create a new expense
   */
  createExpense: (expenseData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_CREATE, expenseData, () => api.post('/api/expenses', expenseData, config)),

  /**
   * Expenses: Update an existing expense
   */
  updateExpense: (id: number, expenseData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_UPDATE, { id, ...expenseData }, () =>
      api.put(`/api/expenses/${id}`, expenseData, config)
    ),

  /**
   * Expenses: Delete an expense
   */
  deleteExpense: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_DELETE, { id }, () => api.delete(`/api/expenses/${id}`, config)),

  /**
   * Expense Payments: Add a payment to an expense
   */
  createExpensePayment: (expenseId: number, paymentData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_ADD_PAYMENT, { id: expenseId, ...paymentData }, () =>
      api.post(`/api/expenses/${expenseId}/payments`, paymentData, config)
    ),

  /**
   * Expense Payments: Update an expense payment
   */
  updateExpensePayment: (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_UPDATE_PAYMENT, { id: paymentId, ...paymentData }, () =>
      api.put(`/api/expenses/payments/${paymentId}`, paymentData, config)
    ),

  /**
   * Expense Payments: Delete an expense payment
   */
  deleteExpensePayment: (paymentId: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.EXPENSE_DELETE_PAYMENT, { id: paymentId }, () =>
      api.delete(`/api/expenses/payments/${paymentId}`, config)
    ),

  /**
   * Purchases: Fetch purchases with optional filters
   */
  fetchPurchases: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_GET_ALL, params, () => api.get('/api/purchases', { ...config, params })),

  /**
   * Purchases: Create a new purchase
   */
  createPurchase: (purchaseData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_CREATE, purchaseData, () => api.post('/api/purchases', purchaseData, config)),

  /**
   * Purchases: Update an existing purchase
   */
  updatePurchase: (id: number, purchaseData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_UPDATE, { id, ...purchaseData }, () =>
      api.put(`/api/purchases/${id}`, purchaseData, config)
    ),

  /**
   * Purchases: Delete a purchase
   */
  deletePurchase: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_DELETE, { id }, () => api.delete(`/api/purchases/${id}`, config)),

  /**
   * Purchase Payments: Add a payment to a purchase
   */
  createPurchasePayment: (purchaseId: number, paymentData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_ADD_PAYMENT, { id: purchaseId, ...paymentData }, () =>
      api.post(`/api/purchases/${purchaseId}/payments`, paymentData, config)
    ),

  /**
   * Purchase Payments: Update a purchase payment
   */
  updatePurchasePayment: (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_UPDATE_PAYMENT, { id: paymentId, ...paymentData }, () =>
      api.put(`/api/purchases/payments/${paymentId}`, paymentData, config)
    ),

  /**
   * Purchase Payments: Delete a purchase payment
   */
  deletePurchasePayment: (paymentId: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PURCHASE_DELETE_PAYMENT, { id: paymentId }, () =>
      api.delete(`/api/purchases/payments/${paymentId}`, config)
    ),

  /**
   * Loose Sales: Create a new loose sale
   */
  createLooseSale: (saleData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.LOOSE_SALE_CREATE, saleData, () => api.post('/api/loose-sales', saleData, config)),

  /**
   * Loose Sales: Delete a loose sale record
   */
  deleteLooseSale: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.LOOSE_SALE_DELETE, { id }, () => api.delete(`/api/loose-sales/${id}`, config)),
};

export default posService;
