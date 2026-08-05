import type { AxiosRequestConfig } from 'axios';
import api from '@/shared/api/api';

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

/**
 * POS Service
 * Centralizes all sales and transaction related API calls.
 */
const posService = {
  /**
   * Process a new sale
   */
  processSale: async (saleData: ProcessSalePayload, config: RequestConfig = {}) => {
    const response = await api.post('/api/sale', saleData, config);
    return response.data;
  },

  /**
   * Fetch a specific sale by ID
   */
  fetchSaleById: async (id: number | string, config: RequestConfig = {}) => {
    const response = await api.get(`/api/sale/${id}`, config);
    return response.data;
  },

  /**
   * Fetch sales history
   */
  fetchSalesHistory: async (params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get('/api/reports', { ...config, params });
    return response.data;
  },

  /**
   * Process a refund
   */
  processRefund: async (saleId: number, items: RefundItemPayload[], config: RequestConfig = {}) => {
    const response = await api.post(`/api/sale/${saleId}/return`, { items }, config);
    return response.data;
  },

  /**
   * Promotions: Fetch all promotions
   */
  fetchPromotions: async (config: RequestConfig = {}) => {
    const response = await api.get('/api/promotions', config);
    return response.data;
  },

  /**
   * Promotions: Create a new promotion
   */
  createPromotion: async (promoData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/promotions', promoData, config);
    return response.data;
  },

  /**
   * Promotions: Update an existing promotion
   */
  updatePromotion: async (id: number, promoData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/promotions/${id}`, promoData, config);
    return response.data;
  },

  /**
   * Promotions: Delete a promotion
   */
  deletePromotion: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/promotions/${id}`, config);
    return response.data;
  },

  /**
   * Promotions: Fetch pricing options for a product in promotions context
   */
  fetchPromotionProductOptions: async (productId: number, config: RequestConfig = {}) => {
    const response = await api.get(`/api/promotions/product-options/${productId}`, config);
    return response.data;
  },

  /**
   * Expenses: Fetch expenses with optional filters
   */
  fetchExpenses: async (params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get('/api/expenses', { ...config, params });
    return response.data;
  },

  /**
   * Expenses: Create a new expense
   */
  createExpense: async (expenseData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/expenses', expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Update an existing expense
   */
  updateExpense: async (id: number, expenseData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/expenses/${id}`, expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Delete an expense
   */
  deleteExpense: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/expenses/${id}`, config);
    return response.data;
  },

  /**
   * Expense Payments: Add a payment to an expense
   */
  createExpensePayment: async (expenseId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post(`/api/expenses/${expenseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Update an expense payment
   */
  updateExpensePayment: async (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/expenses/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Delete an expense payment
   */
  deleteExpensePayment: async (paymentId: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/expenses/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Purchases: Fetch purchases with optional filters
   */
  fetchPurchases: async (params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get('/api/purchases', { ...config, params });
    return response.data;
  },

  /**
   * Purchases: Create a new purchase
   */
  createPurchase: async (purchaseData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/purchases', purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Update an existing purchase
   */
  updatePurchase: async (id: number, purchaseData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/purchases/${id}`, purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Delete a purchase
   */
  deletePurchase: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/purchases/${id}`, config);
    return response.data;
  },

  /**
   * Purchase Payments: Add a payment to a purchase
   */
  createPurchasePayment: async (purchaseId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post(`/api/purchases/${purchaseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Update a purchase payment
   */
  updatePurchasePayment: async (paymentId: number, paymentData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/purchases/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Delete a purchase payment
   */
  deletePurchasePayment: async (paymentId: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/purchases/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Loose Sales: Create a new loose sale
   */
  createLooseSale: async (saleData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/loose-sales', saleData, config);
    return response.data;
  },

  /**
   * Loose Sales: Delete a loose sale record
   */
  deleteLooseSale: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/loose-sales/${id}`, config);
    return response.data;
  },
};

export default posService;
