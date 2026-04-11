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

const productHistoryQuerySchema = Joi.object({
    range: Joi.string().trim().optional(),
    startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
    endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional()
});

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
    productHistoryQuerySchema,
    validateBarcodesBodySchema,
    bulkCreateProductsBodySchema
};
