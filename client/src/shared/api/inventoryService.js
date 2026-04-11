import api from './api';

/**
 * Inventory Service
 * Centralizes all product and category related API calls.
 */
const inventoryService = {
  /**
   * Fetch all products with their associated batches and history
   */
  fetchProducts: async (params, config = {}) => {
    const response = await api.get('/api/products', { ...config, params });
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (productData, config = {}) => {
    const response = await api.post('/api/products', productData, config);
    return response.data;
  },

  /**
   * Update an existing product
   */
  updateProduct: async (id, productData, config = {}) => {
    const response = await api.put(`/api/products/${id}`, productData, config);
    return response.data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id, config = {}) => {
    const response = await api.delete(`/api/products/${id}`, config);
    return response.data;
  },

  /**
   * Quick update of product stock/quantity
   */
  quickUpdateStock: async (id, data, config = {}) => {
    const response = await api.patch(`/api/inventory/${id}/stock`, data, config);
    return response.data;
  },

  /**
   * Fetch all product categories
   */
  fetchCategories: async (config = {}) => {
    const response = await api.get('/api/categories', config);
    return response.data;
  },

  /**
   * Bulk update products (e.g., via Excel upload)
   */
  bulkUpdate: async (products, config = {}) => {
    const response = await api.post('/api/products/bulk', { products }, config);
    return response.data;
  },

  /**
   * Update an existing batch
   */
  updateBatch: async (id, batchData, config = {}) => {
    const response = await api.put(`/api/batches/${id}`, batchData, config);
    return response.data;
  },

  /**
   * Delete a batch
   */
  deleteBatch: async (id, config = {}) => {
    const response = await api.delete(`/api/batches/${id}`, config);
    return response.data;
  },

  /**
   * Update product prices (MRP, Selling Price, etc.)
   */
  updateProductPrices: async (id, priceData, config = {}) => {
    const response = await api.put(`/api/products/${id}/prices`, priceData, config);
    return response.data;
  },

  /**
   * Fetch product by barcode
   */
  fetchProductByBarcode: async (barcode, config = {}) => {
    const response = await api.get(`/api/products/${barcode}`, config);
    return response.data;
  },

  /**
   * Fetch product details by ID
   */
  fetchProductById: async (id, config = {}) => {
    const response = await api.get(`/api/products/id/${id}`, config);
    return response.data;
  },

  /**
   * Fetch inventory summary and category counts
   */
  fetchSummary: async (params, config = {}) => {
    const response = await api.get('/api/products/summary', { ...config, params });
    return response.data;
  },

  /**
   * Fetch product stock history
   */
  fetchProductHistory: async (id, params, config = {}) => {
    const response = await api.get(`/api/products/${id}/history`, { ...config, params });
    return response.data;
  },

  /**
   * Add a new stock batch
   */
  addBatch: async (payload, config = {}) => {
    const response = await api.post('/api/batches', payload, config);
    return response.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (categoryData, config = {}) => {
    const response = await api.post('/api/categories', categoryData, config);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (id, categoryData, config = {}) => {
    const response = await api.put(`/api/categories/${id}`, categoryData, config);
    return response.data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id, config = {}) => {
    const response = await api.delete(`/api/categories/${id}`, config);
    return response.data;
  },

  /**
   * Assign products to a category
   */
  assignCategory: async (data, config = {}) => {
    const response = await api.post('/api/categories/assign', data, config);
    return response.data;
  },

  /**
   * Validate barcodes against database
   */
  validateBarcodes: async (barcodes, config = {}) => {
    const response = await api.post('/api/products/validate-barcodes', { barcodes }, config);
    return response.data;
  },

  /**
   * Import products from CSV file
   */
  importProducts: async (formData, config = {}) => {
    const response = await api.post('/api/products/import', formData, {
      ...config,
      headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default inventoryService;
