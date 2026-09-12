import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { dualCall, invokeIpc } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';

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
  fetchProducts: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_GET_ALL, params, () => api.get('/api/products', { ...config, params })),

  /**
   * Create a new product
   */
  createProduct: (productData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_CREATE, productData, () => api.post('/api/products', productData, config)),

  /**
   * Update an existing product
   */
  updateProduct: (id: number, productData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_UPDATE, { id, ...productData }, () =>
      api.put(`/api/products/${id}`, productData, config)
    ),

  /**
   * Delete a product
   */
  deleteProduct: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_DELETE, { id }, () => api.delete(`/api/products/${id}`, config)),

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
  fetchCategories: (config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.CATEGORY_GET_CATEGORIES, undefined, () => api.get('/api/categories', config)),

  /**
   * Update an existing batch
   */
  updateBatch: (id: number, batchData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_UPDATE_BATCH, { id, ...batchData }, () =>
      api.put(`/api/batches/${id}`, batchData, config)
    ),

  /**
   * Delete a batch
   */
  deleteBatch: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_DELETE_BATCH, { id }, () => api.delete(`/api/batches/${id}`, config)),

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
  fetchProductByBarcode: (barcode: string, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_GET_BY_BARCODE, { barcode }, () =>
      api.get(`/api/products/${barcode}`, config)
    ),

  /**
   * Fetch product details by ID
   */
  fetchProductById: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_GET_BY_ID, { id }, () => api.get(`/api/products/id/${id}`, config)),

  /**
   * Fetch inventory summary and category counts
   */
  fetchSummary: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_GET_SUMMARY, params, () =>
      api.get('/api/products/summary', { ...config, params })
    ),

  /**
   * Fetch product stock history
   */
  fetchProductHistory: (id: number, params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_GET_HISTORY, { id, ...params }, () =>
      api.get(`/api/products/${id}/history`, { ...config, params })
    ),

  /**
   * Add a new stock batch
   */
  addBatch: (payload: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_ADD_BATCH, payload, () => api.post('/api/batches', payload, config)),

  /**
   * Create a new category
   */
  createCategory: (categoryData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.CATEGORY_CREATE, categoryData, () =>
      api.post('/api/categories', categoryData, config)
    ),

  /**
   * Update a category
   */
  updateCategory: (id: number, categoryData: RequestBody, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.CATEGORY_UPDATE, { id, ...categoryData }, () =>
      api.put(`/api/categories/${id}`, categoryData, config)
    ),

  /**
   * Delete a category
   */
  deleteCategory: (id: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.CATEGORY_DELETE, { id }, () => api.delete(`/api/categories/${id}`, config)),

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
  validateBarcodes: (barcodes: string[], config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.PRODUCT_VALIDATE_BARCODES, { barcodes }, () =>
      api.post('/api/products/validate-barcodes', { barcodes }, config)
    ),

  /**
   * Import products from CSV file
   */
  importProducts: async (formData: FormData, config: RequestConfig = {}) => {
    if (isElectronProd) {
      const file = formData.get('file');
      const csvData = file instanceof Blob ? await file.text() : '';
      return invokeIpc(IPC.PRODUCT_IMPORT, { csvData });
    }
    const response = await api.post('/api/products/import', formData, {
      ...config,
      headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Export all products as a CSV file, returned as raw text (not a Blob —
   * the IPC path has no HTTP response to carry a real Content-Type/blob;
   * the renderer builds the Blob itself before triggering the download).
   */
  exportProducts: (config: RequestConfig = {}): Promise<string> =>
    dualCall(isElectronProd, IPC.PRODUCT_EXPORT, undefined, () =>
      api.get('/api/products/export', { ...config, responseType: 'text' })
    ),
};

export default inventoryService;
