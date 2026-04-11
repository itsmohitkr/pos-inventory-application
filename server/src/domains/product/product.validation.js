const { Joi } = require('../../shared/middleware/validateRequest');

const numericId = Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().trim().pattern(/^\d+$/)
);

const productIdParamSchema = Joi.object({
    id: numericId.required()
});

const batchIdParamSchema = Joi.object({
    id: numericId.required()
});

const barcodeParamSchema = Joi.object({
    barcode: Joi.string().trim().min(1).required()
});

const productQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(10000).optional(),
    search: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional(),
    sortBy: Joi.string().trim().optional(),
    sortOrder: Joi.string().trim().valid('asc', 'desc').optional(),
    includeBatches: Joi.string().trim().valid('true', 'false').optional()
});

const productSummaryQuerySchema = Joi.object({
    search: Joi.string().allow('').optional(),
    category: Joi.string().allow('').optional()
}).unknown(true);

const productHistoryQuerySchema = Joi.object({
    range: Joi.string().trim().optional(),
    startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
    endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional()
}).unknown(true);

const numericValue = Joi.alternatives().try(
    Joi.number().min(0),
    Joi.string().trim().allow('', null)
);

const integerValue = Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().trim().allow('', null)
);

const dateValue = Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().trim().allow('', null)
);

const initialBatchSchema = Joi.object({
    quantity: integerValue.optional(),
    mrp: numericValue.optional(),
    cost_price: numericValue.optional(),
    selling_price: numericValue.optional(),
    batch_code: Joi.string().trim().allow('', null).optional(),
    expiryDate: dateValue.optional(),
    wholesaleEnabled: Joi.boolean().optional(),
    wholesalePrice: numericValue.optional(),
    wholesaleMinQty: integerValue.optional()
}).unknown(true);

const createProductBodySchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required(),
    barcode: Joi.string().trim().allow('', null).optional(),
    category: Joi.string().trim().allow('', null).optional(),
    enableBatchTracking: Joi.boolean().optional(),
    lowStockWarningEnabled: Joi.boolean().optional(),
    lowStockThreshold: integerValue.optional(),
    initialBatch: initialBatchSchema.optional()
}).unknown(true);

const addBatchBodySchema = Joi.object({
    product_id: numericId.required(),
    batch_code: Joi.string().trim().allow('', null).optional(),
    quantity: integerValue.required(),
    mrp: numericValue.optional(),
    cost_price: numericValue.optional(),
    selling_price: numericValue.optional(),
    expiryDate: dateValue.optional(),
    wholesaleEnabled: Joi.boolean().optional(),
    wholesalePrice: numericValue.optional(),
    wholesaleMinQty: integerValue.optional()
}).unknown(true);

const updateProductBodySchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).optional(),
    barcode: Joi.string().trim().allow('', null).optional(),
    category: Joi.string().trim().allow('', null).optional(),
    batchTrackingEnabled: Joi.boolean().optional(),
    lowStockWarningEnabled: Joi.boolean().optional(),
    lowStockThreshold: integerValue.optional()
}).unknown(true);

const updateBatchBodySchema = Joi.object({
    batchCode: Joi.string().trim().allow('', null).optional(),
    quantity: integerValue.optional(),
    mrp: numericValue.optional(),
    costPrice: numericValue.optional(),
    sellingPrice: numericValue.optional(),
    expiryDate: dateValue.optional(),
    wholesaleEnabled: Joi.boolean().optional(),
    wholesalePrice: numericValue.optional(),
    wholesaleMinQty: integerValue.optional()
}).unknown(true);

const validateBarcodesBodySchema = Joi.object({
    barcodes: Joi.array().items(Joi.string().trim().min(1)).min(1).required()
});

const bulkCreateProductsBodySchema = Joi.object({
    products: Joi.array().items(Joi.object().unknown(true)).min(1).required()
});

module.exports = {
    productIdParamSchema,
    batchIdParamSchema,
    barcodeParamSchema,
    productQuerySchema,
    productSummaryQuerySchema,
    productHistoryQuerySchema,
    createProductBodySchema,
    addBatchBodySchema,
    updateProductBodySchema,
    updateBatchBodySchema,
    validateBarcodesBodySchema,
    bulkCreateProductsBodySchema
};
