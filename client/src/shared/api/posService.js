import api from '@/shared/api/api';

/**
 * POS Service
 * Centralizes all sales and transaction related API calls.
 */
const posService = {
  /**
   * Process a new sale
   */
  processSale: async (saleData, config = {}) => {
    const response = await api.post('/api/sale', saleData, config);
    return response.data;
  },

  /**
   * Fetch a specific sale by ID
   */
  fetchSaleById: async (id, config = {}) => {
    const response = await api.get(`/api/sale/${id}`, config);
    return response.data;
  },

  /**
   * Fetch sales history
   */
  fetchSalesHistory: async (params, config = {}) => {
    const response = await api.get('/api/reports', { ...config, params });
    return response.data;
  },

  /**
   * Process a refund
   */
  processRefund: async (saleId, items, config = {}) => {
    const response = await api.post(`/api/sale/${saleId}/return`, { items }, config);
    return response.data;
  },

  /**
   * Promotions: Fetch all promotions
   */
  fetchPromotions: async (config = {}) => {
    const response = await api.get('/api/promotions', config);
    return response.data;
  },

  /**
   * Promotions: Create a new promotion
   */
  createPromotion: async (promoData, config = {}) => {
    const response = await api.post('/api/promotions', promoData, config);
    return response.data;
  },

  /**
   * Promotions: Update an existing promotion
   */
  updatePromotion: async (id, promoData, config = {}) => {
    const response = await api.put(`/api/promotions/${id}`, promoData, config);
    return response.data;
  },

  /**
   * Promotions: Delete a promotion
   */
  deletePromotion: async (id, config = {}) => {
    const response = await api.delete(`/api/promotions/${id}`, config);
    return response.data;
  },

  /**
   * Promotions: Fetch pricing options for a product in promotions context
   */
  fetchPromotionProductOptions: async (productId, config = {}) => {
    const response = await api.get(`/api/promotions/product-options/${productId}`, config);
    return response.data;
  },

  /**
   * Expenses: Fetch expenses with optional filters
   */
  fetchExpenses: async (params, config = {}) => {
    const response = await api.get('/api/expenses', { ...config, params });
    return response.data;
  },

  /**
   * Expenses: Create a new expense
   */
  createExpense: async (expenseData, config = {}) => {
    const response = await api.post('/api/expenses', expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Update an existing expense
   */
  updateExpense: async (id, expenseData, config = {}) => {
    const response = await api.put(`/api/expenses/${id}`, expenseData, config);
    return response.data;
  },

  /**
   * Expenses: Delete an expense
   */
  deleteExpense: async (id, config = {}) => {
    const response = await api.delete(`/api/expenses/${id}`, config);
    return response.data;
  },

  /**
   * Expense Payments: Add a payment to an expense
   */
  createExpensePayment: async (expenseId, paymentData, config = {}) => {
    const response = await api.post(`/api/expenses/${expenseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Update an expense payment
   */
  updateExpensePayment: async (paymentId, paymentData, config = {}) => {
    const response = await api.put(`/api/expenses/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Expense Payments: Delete an expense payment
   */
  deleteExpensePayment: async (paymentId, config = {}) => {
    const response = await api.delete(`/api/expenses/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Purchases: Fetch purchases with optional filters
   */
  fetchPurchases: async (params, config = {}) => {
    const response = await api.get('/api/purchases', { ...config, params });
    return response.data;
  },

  /**
   * Purchases: Create a new purchase
   */
  createPurchase: async (purchaseData, config = {}) => {
    const response = await api.post('/api/purchases', purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Update an existing purchase
   */
  updatePurchase: async (id, purchaseData, config = {}) => {
    const response = await api.put(`/api/purchases/${id}`, purchaseData, config);
    return response.data;
  },

  /**
   * Purchases: Delete a purchase
   */
  deletePurchase: async (id, config = {}) => {
    const response = await api.delete(`/api/purchases/${id}`, config);
    return response.data;
  },

  /**
   * Purchase Payments: Add a payment to a purchase
   */
  createPurchasePayment: async (purchaseId, paymentData, config = {}) => {
    const response = await api.post(`/api/purchases/${purchaseId}/payments`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Update a purchase payment
   */
  updatePurchasePayment: async (paymentId, paymentData, config = {}) => {
    const response = await api.put(`/api/purchases/payments/${paymentId}`, paymentData, config);
    return response.data;
  },

  /**
   * Purchase Payments: Delete a purchase payment
   */
  deletePurchasePayment: async (paymentId, config = {}) => {
    const response = await api.delete(`/api/purchases/payments/${paymentId}`, config);
    return response.data;
  },

  /**
   * Loose Sales: Create a new loose sale
   */
  createLooseSale: async (saleData, config = {}) => {
    const response = await api.post('/api/loose-sales', saleData, config);
    return response.data;
  },

  /**
   * Loose Sales: Delete a loose sale record
   */
  deleteLooseSale: async (id, config = {}) => {
    const response = await api.delete(`/api/loose-sales/${id}`, config);
    return response.data;
  },
};

export default posService;
