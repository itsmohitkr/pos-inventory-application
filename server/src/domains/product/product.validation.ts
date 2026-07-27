import { z, id, int, num, str, bool } from '../../shared/middleware/zodHelpers';

const numericId = z.union([id(), str().regex(/^\d+$/)]);

/**
 * Form-style values: a number, or a string (including empty) because the client
 * sends raw text-input values. Mirrors Joi's
 * `alternatives().try(number, string.allow('', null))`.
 */
const numericValue = z.union([num().min(0), z.string().trim(), z.null()]);
const integerValue = z.union([int().min(0), z.string().trim(), z.null()]);
const dateValue = z.union([z.coerce.date(), z.string().trim(), z.null()]);

const productIdParamSchema = z.object({ id: numericId });
const batchIdParamSchema = z.object({ id: numericId });
const barcodeParamSchema = z.object({ barcode: str().min(1) });

const productQuerySchema = z.object({
  page: int().min(1).optional(),
  pageSize: int().min(1).max(10000).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: str().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeBatches: z.enum(['true', 'false']).optional(),
});

const productSummaryQuerySchema = z.looseObject({
  search: z.string().optional(),
  category: z.string().optional(),
});

const productHistoryQuerySchema = z.looseObject({
  range: str().optional(),
  startDate: dateValue.optional(),
  endDate: dateValue.optional(),
});

const batchFields = {
  mrp: numericValue.optional(),
  expiryDate: dateValue.optional(),
  wholesaleEnabled: bool().optional(),
  wholesalePrice: numericValue.optional(),
  wholesaleMinQty: integerValue.optional(),
};

const initialBatchSchema = z.looseObject({
  ...batchFields,
  quantity: integerValue.optional(),
  cost_price: numericValue.optional(),
  selling_price: numericValue.optional(),
  batch_code: str().nullable().optional(),
});

const createProductBodySchema = z.looseObject({
  name: str().min(1).max(255),
  barcode: str().nullable().optional(),
  category: str().nullable().optional(),
  enableBatchTracking: bool().optional(),
  lowStockWarningEnabled: bool().optional(),
  lowStockThreshold: integerValue.optional(),
  initialBatch: initialBatchSchema.optional(),
});

const addBatchBodySchema = z.looseObject({
  ...batchFields,
  product_id: numericId,
  batch_code: str().nullable().optional(),
  quantity: integerValue,
  cost_price: numericValue.optional(),
  selling_price: numericValue.optional(),
});

const updateProductBodySchema = z.looseObject({
  name: str().min(1).max(255).optional(),
  barcode: str().nullable().optional(),
  category: str().nullable().optional(),
  batchTrackingEnabled: bool().optional(),
  lowStockWarningEnabled: bool().optional(),
  lowStockThreshold: integerValue.optional(),
});

const updateBatchBodySchema = z.looseObject({
  ...batchFields,
  batchCode: str().nullable().optional(),
  quantity: integerValue.optional(),
  costPrice: numericValue.optional(),
  sellingPrice: numericValue.optional(),
});

const validateBarcodesBodySchema = z.object({
  barcodes: z.array(str().min(1)).min(1),
});

const bulkCreateProductsBodySchema = z.object({
  products: z.array(z.looseObject({})).min(1),
});

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 *
 * These schemas are `looseObject` (Joi's `.unknown(true)`), so the inferred
 * types carry an index signature for the passthrough keys.
 */
export type CreateProductInput = z.infer<typeof createProductBodySchema>;
export type UpdateProductInput = z.infer<typeof updateProductBodySchema>;
export type AddBatchInput = z.infer<typeof addBatchBodySchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchBodySchema>;
export type BulkCreateProductsInput = z.infer<typeof bulkCreateProductsBodySchema>;

export {
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
  bulkCreateProductsBodySchema,
};
