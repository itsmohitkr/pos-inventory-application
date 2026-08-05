import type { AxiosRequestConfig } from 'axios';
import api from '@/shared/api/api';

/** Per-call axios options — used throughout for AbortController signals. */
type RequestConfig = AxiosRequestConfig;

/** Query params forwarded to axios `params`. */
type QueryParams = Record<string, unknown>;

/**
 * Request bodies are typed loosely for now: the server accepts snake_case keys
 * (cost_price, selling_price, batch_code) that do not match the Prisma models,
 * so a precise shape has to wait until the server domains are converted.
 * TODO(ts-migration): tighten once server/src/domains/product is typed.
 */
type RequestBody = Record<string, unknown>;

/**
 * Inventory Service
 * Centralizes all product and category related API calls.
 */
const inventoryService = {
  /**
   * Fetch all products with their associated batches and history
   */
  fetchProducts: async (params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get('/api/products', { ...config, params });
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (productData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/products', productData, config);
    return response.data;
  },

  /**
   * Update an existing product
   */
  updateProduct: async (id: number, productData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/products/${id}`, productData, config);
    return response.data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/products/${id}`, config);
    return response.data;
  },

  /**
   * Quick update of product stock/quantity
   */
  quickUpdateStock: async (id: number, data: RequestBody, config: RequestConfig = {}) => {
    const response = await api.patch(`/api/inventory/${id}/stock`, data, config);
    return response.data;
  },

  /**
   * Fetch all product categories
   */
  fetchCategories: async (config: RequestConfig = {}) => {
    const response = await api.get('/api/categories', config);
    return response.data;
  },

  /**
   * Bulk update products (e.g., via Excel upload)
   */
  bulkUpdate: async (products: RequestBody[], config: RequestConfig = {}) => {
    const response = await api.post('/api/products/bulk', { products }, config);
    return response.data;
  },

  /**
   * Update an existing batch
   */
  updateBatch: async (id: number, batchData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/batches/${id}`, batchData, config);
    return response.data;
  },

  /**
   * Delete a batch
   */
  deleteBatch: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/batches/${id}`, config);
    return response.data;
  },

  /**
   * Update product prices (MRP, Selling Price, etc.)
   */
  updateProductPrices: async (id: number, priceData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/products/${id}/prices`, priceData, config);
    return response.data;
  },

  /**
   * Fetch product by barcode
   */
  fetchProductByBarcode: async (barcode: string, config: RequestConfig = {}) => {
    const response = await api.get(`/api/products/${barcode}`, config);
    return response.data;
  },

  /**
   * Fetch product details by ID
   */
  fetchProductById: async (id: number, config: RequestConfig = {}) => {
    const response = await api.get(`/api/products/id/${id}`, config);
    return response.data;
  },

  /**
   * Fetch inventory summary and category counts
   */
  fetchSummary: async (params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get('/api/products/summary', { ...config, params });
    return response.data;
  },

  /**
   * Fetch product stock history
   */
  fetchProductHistory: async (id: number, params?: QueryParams, config: RequestConfig = {}) => {
    const response = await api.get(`/api/products/${id}/history`, { ...config, params });
    return response.data;
  },

  /**
   * Add a new stock batch
   */
  addBatch: async (payload: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/batches', payload, config);
    return response.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (categoryData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/categories', categoryData, config);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, categoryData: RequestBody, config: RequestConfig = {}) => {
    const response = await api.put(`/api/categories/${id}`, categoryData, config);
    return response.data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id: number, config: RequestConfig = {}) => {
    const response = await api.delete(`/api/categories/${id}`, config);
    return response.data;
  },

  /**
   * Assign products to a category
   */
  assignCategory: async (data: RequestBody, config: RequestConfig = {}) => {
    const response = await api.post('/api/categories/assign', data, config);
    return response.data;
  },

  /**
   * Validate barcodes against database
   */
  validateBarcodes: async (barcodes: string[], config: RequestConfig = {}) => {
    const response = await api.post('/api/products/validate-barcodes', { barcodes }, config);
    return response.data;
  },

  /**
   * Import products from CSV file
   */
  importProducts: async (formData: FormData, config: RequestConfig = {}) => {
    const response = await api.post('/api/products/import', formData, {
      ...config,
      headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default inventoryService;
