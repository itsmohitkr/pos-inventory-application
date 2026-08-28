// Mirror of desktop/ipcChannels.js for use in React components.
// Keep these strings in sync with the desktop file.
export const IPC = {
  // Printer
  GET_PRINTERS: 'get-printers',
  PRINT_MANUAL: 'print-manual',
  PRINT_HTML_CONTENT: 'print-html-content',

  // App metadata
  GET_APP_VERSION: 'get-app-version',
  GET_APP_METADATA: 'get-app-metadata',
  GET_APP_PATH: 'get-app-path',

  // Auto-update (renderer → main)
  CHECK_FOR_UPDATES: 'check-for-updates',
  START_DOWNLOAD: 'start-download',
  RESTART_APP: 'restart-app',

  // Auto-update (main → renderer)
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_ERROR: 'update-error',
  DOWNLOAD_PROGRESS: 'download-progress',

  // API bridge — generic IPC proxy from renderer to Express (production Electron only)
  API_BRIDGE: 'api-bridge',

  // Domain IPC — direct renderer -> service calls, bypassing Express entirely.
  // See desktop/ipc/*.ipc.ts and the IPC migration plan. Channel names match
  // the controller method they replace (domain:methodName).
  CATEGORY_GET_CATEGORIES: 'category:getCategories',
  CATEGORY_CREATE: 'category:createCategory',
  CATEGORY_UPDATE: 'category:updateCategory',
  CATEGORY_DELETE: 'category:deleteCategory',

  SETTING_GET_ALL: 'setting:getAllSettings',
  SETTING_UPDATE: 'setting:updateSettings',

  REPORT_GET_REPORTS: 'report:getReports',
  REPORT_GET_EXPIRY: 'report:getExpiryReport',
  REPORT_GET_LOW_STOCK: 'report:getLowStockReport',
  REPORT_GET_MONTHLY: 'report:getMonthlySales',
  REPORT_GET_DAILY: 'report:getDailySales',
  REPORT_GET_TOP_SELLING: 'report:getTopSellingProducts',

  PROMOTION_CREATE: 'promotion:createPromotion',
  PROMOTION_GET_ALL: 'promotion:getAllPromotions',
  PROMOTION_UPDATE: 'promotion:updatePromotion',
  PROMOTION_DELETE: 'promotion:deletePromotion',
  PROMOTION_GET_PRODUCT_PRICING_OPTIONS: 'promotion:getProductPricingOptions',
  PROMOTION_GET_EFFECTIVE_PRICE: 'promotion:getEffectivePromoPrice',

  CATEGORY_SALE_CREATE: 'category-sale:createCategorySale',
  CATEGORY_SALE_GET_ALL: 'category-sale:getAllCategorySales',
  CATEGORY_SALE_GET_BY_ID: 'category-sale:getCategorySaleById',
  CATEGORY_SALE_UPDATE: 'category-sale:updateCategorySale',
  CATEGORY_SALE_TOGGLE_STATUS: 'category-sale:toggleCategorySaleStatus',
  CATEGORY_SALE_DELETE: 'category-sale:deleteCategorySale',
  CATEGORY_SALE_PREVIEW: 'category-sale:previewCategorySale',

  LOOSE_SALE_CREATE: 'loose-sale:createLooseSale',
  LOOSE_SALE_GET_REPORT: 'loose-sale:getLooseSalesReport',
  LOOSE_SALE_DELETE: 'loose-sale:deleteLooseSale',

  CUSTOMER_FIND_OR_CREATE: 'customer:findOrCreate',
  CUSTOMER_GET_ALL: 'customer:getAllCustomers',
  CUSTOMER_GET_BY_ID: 'customer:getCustomerById',
  CUSTOMER_UPDATE: 'customer:updateCustomer',
  CUSTOMER_GET_BY_BARCODE: 'customer:getByBarcode',
  CUSTOMER_GET_BY_PHONE: 'customer:getByPhone',
  CUSTOMER_GET_PURCHASE_HISTORY: 'customer:getPurchaseHistory',

  EXPENSE_CREATE: 'expense:createExpense',
  EXPENSE_GET_ALL: 'expense:getExpenses',
  EXPENSE_UPDATE: 'expense:updateExpense',
  EXPENSE_DELETE: 'expense:deleteExpense',
  EXPENSE_ADD_PAYMENT: 'expense:addPayment',
  EXPENSE_UPDATE_PAYMENT: 'expense:updatePayment',
  EXPENSE_DELETE_PAYMENT: 'expense:deletePayment',

  PURCHASE_CREATE: 'purchase:createPurchase',
  PURCHASE_GET_ALL: 'purchase:getPurchases',
  PURCHASE_UPDATE: 'purchase:updatePurchase',
  PURCHASE_DELETE: 'purchase:deletePurchase',
  PURCHASE_ADD_PAYMENT: 'purchase:addPayment',
  PURCHASE_UPDATE_PAYMENT: 'purchase:updatePayment',
  PURCHASE_DELETE_PAYMENT: 'purchase:deletePayment',

  SALE_PROCESS: 'sale:processSale',
  SALE_GET_BY_ID: 'sale:getSaleById',
  SALE_PROCESS_RETURN: 'sale:processReturn',

  PRODUCT_GET_ALL: 'product:getAllProducts',
  PRODUCT_GET_SUMMARY: 'product:getProductSummary',
  PRODUCT_GET_BY_ID: 'product:getProductById',
  PRODUCT_GET_BY_BARCODE: 'product:getProductByBarcode',
  PRODUCT_GET_HISTORY: 'product:getProductHistory',
  PRODUCT_CREATE: 'product:createProduct',
  PRODUCT_ADD_BATCH: 'product:addBatch',
  PRODUCT_UPDATE: 'product:updateProduct',
  PRODUCT_DELETE: 'product:deleteProduct',
  PRODUCT_UPDATE_BATCH: 'product:updateBatch',
  PRODUCT_DELETE_BATCH: 'product:deleteBatch',
  PRODUCT_EXPORT: 'product:exportProducts',
  PRODUCT_IMPORT: 'product:importProducts',
  PRODUCT_VALIDATE_BARCODES: 'product:validateBarcodes',

  AUTH_LOGIN: 'auth:login',
  AUTH_GET_ALL_USERS: 'auth:getAllUsers',
  AUTH_CREATE_USER: 'auth:createUser',
  AUTH_UPDATE_USER: 'auth:updateUser',
  AUTH_DELETE_USER: 'auth:deleteUser',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',
  AUTH_WIPE_DATABASE: 'auth:wipeDatabase',
  AUTH_VERIFY_ADMIN: 'auth:verifyAdmin',
  AUTH_COMPLETE_ONBOARDING: 'auth:completeOnboarding',

  // Splash screen (main → splash renderer)
  SPLASH_STATUS: 'splash-status',
  SPLASH_VERSION: 'splash-version',
} as const;

/** Union of every valid IPC channel name. */
export type IpcChannel = (typeof IPC)[keyof typeof IPC];
