import { z, int, num, str, bool, numericId } from '../../shared/middleware/zodHelpers';

/**
 * Form-style values: a number, or a string (including empty) because the client
 * sends raw text-input values. Mirrors Joi's
 * `alternatives().try(number, string.allow('', null))`.
 *
 * Shared across every batch-carrying body schema below.
 */
const numericValue = z.union([num().min(0, 'Must be zero or greater'), z.string().trim(), z.null()]);
const integerValue = z.union([int().min(0, 'Must be zero or greater'), z.string().trim(), z.null()]);
const dateValue = z.union([z.coerce.date(), z.string().trim(), z.null()]);

/**
 * Expiry date for a NEWLY created batch (initial stock, or Add Batch) —
 * must be today or later, and within 10 years. Deliberately NOT used for
 * UpdateBatchSchema (which keeps the loose dateValue above): a batch that
 * already carries a past expiry (the exact scenario this validation exists
 * to prevent going forward) must still be editable for its other fields —
 * price, wholesale settings — without being blocked by its own pre-existing
 * date.
 */
const newBatchExpiryDate = dateValue.refine(
  (value) => {
    if (value === null || value === '') return true;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return true; // malformed dates are reported by dateValue's own coercion, not here
    // Boundaries built from UTC date components, not local setHours(0,0,0,0):
    // a date-only string like "2026-08-11" is parsed by z.coerce.date() (the
    // union branch that wins above) as UTC midnight. Comparing that against
    // a locally-computed midnight would, in any negative-UTC-offset
    // timezone, wrongly reject a legitimately same-day expiry date — local
    // midnight there is hours ahead of UTC midnight for the same calendar
    // day.
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const maxDate = new Date(Date.UTC(now.getUTCFullYear() + 10, now.getUTCMonth(), now.getUTCDate()));
    return date >= today && date <= maxDate;
  },
  { error: 'Expiry date must be today or later, and within 10 years' }
);

/** Shared by GetProductById, GetProductHistory, UpdateProduct, DeleteProduct. */
const productIdParamSchema = z.object({ id: numericId() });

/** Shared by UpdateBatch and DeleteBatch. */
const batchIdParamSchema = z.object({ id: numericId() });

/** Shared by AddBatch, UpdateBatch (via updateBatchBodySchema below). */
const batchFields = {
  mrp: numericValue.optional(),
  expiryDate: dateValue.optional(),
  wholesaleEnabled: bool().optional(),
  wholesalePrice: numericValue.optional(),
  wholesaleMinQty: integerValue.optional(),
};

/** One grouped schema per router route, named after the controller handler it validates for. */
export const GetAllProductsSchema = {
  query: z.object({
    page: int().min(1, 'Page must be at least 1').optional(),
    pageSize: int().min(1, 'Page size must be at least 1').max(10000, 'Page size is too large').optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    sortBy: str().optional(),
    sortOrder: z.enum(['asc', 'desc'], { error: 'Sort order must be asc or desc' }).optional(),
    // bool(), not z.enum(['true','false']): the HTTP path sends a string
    // ('true'/'false', since query params are always strings), but the IPC
    // path (used by every packaged build) sends a real JS boolean —
    // ipcRenderer.invoke's structured clone preserves it as-is, unlike
    // axios's query-string serialization. An enum of just the two string
    // literals rejected the boolean outright, failing validation before the
    // request ever reached the handler.
    includeBatches: bool().optional(),
  }),
};

export const CreateProductSchema = {
  body: z.looseObject({
    name: str().min(1, 'Product name is required').max(255, 'Product name is too long'),
    barcode: str().min(1, 'At least one barcode is required'),
    category: str().min(1, 'Category is required'),
    enableBatchTracking: bool().optional(),
    lowStockWarningEnabled: bool().optional(),
    lowStockThreshold: integerValue.optional(),
    initialBatch: z.looseObject({
      ...batchFields,
      expiryDate: newBatchExpiryDate.optional(),
      quantity: integerValue,
      cost_price: numericValue,
      selling_price: numericValue,
      mrp: numericValue,
      batch_code: str().nullable().optional(),
    }),
  }),
};

export const GetProductSummarySchema = {
  query: z.looseObject({
    search: z.string().optional(),
    category: z.string().optional(),
  }),
};

export const BulkCreateProductsSchema = {
  body: z.object({
    products: z.array(z.looseObject({})).min(1, 'At least one product is required'),
  }),
};

export const ValidateBarcodesSchema = {
  body: z.object({
    barcodes: z.array(str().min(1, 'Barcode is required')).min(1, 'At least one barcode is required'),
  }),
};

export const GetProductByIdSchema = { params: productIdParamSchema };

export const GetProductHistorySchema = {
  params: productIdParamSchema,
  query: z.looseObject({
    range: str().optional(),
    startDate: dateValue.optional(),
    endDate: dateValue.optional(),
  }),
};

export const GetProductByBarcodeSchema = {
  params: z.object({ barcode: str().min(1, 'Barcode is required') }),
};

export const UpdateProductSchema = {
  params: productIdParamSchema,
  body: z.looseObject({
    name: str().min(1, 'Product name is required').max(255, 'Product name is too long').optional(),
    barcode: str().nullable().optional(),
    category: str().nullable().optional(),
    batchTrackingEnabled: bool().optional(),
    lowStockWarningEnabled: bool().optional(),
    lowStockThreshold: integerValue.optional(),
  }),
};

export const DeleteProductSchema = { params: productIdParamSchema };

export const AddBatchSchema = {
  body: z.looseObject({
    ...batchFields,
    expiryDate: newBatchExpiryDate.optional(),
    product_id: numericId(),
    batch_code: str().nullable().optional(),
    quantity: integerValue,
    cost_price: numericValue.optional(),
    selling_price: numericValue.optional(),
  }),
};

export const UpdateBatchSchema = {
  params: batchIdParamSchema,
  body: z.looseObject({
    ...batchFields,
    batchCode: str().nullable().optional(),
    quantity: integerValue.optional(),
    costPrice: numericValue.optional(),
    sellingPrice: numericValue.optional(),
  }),
};

export const DeleteBatchSchema = { params: batchIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 *
 * These schemas are `looseObject` (Joi's `.unknown(true)`), so the inferred
 * types carry an index signature for the passthrough keys.
 */
export type CreateProductInput = z.infer<typeof CreateProductSchema.body>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema.body>;
export type AddBatchInput = z.infer<typeof AddBatchSchema.body>;
export type UpdateBatchInput = z.infer<typeof UpdateBatchSchema.body>;
export type BulkCreateProductsInput = z.infer<typeof BulkCreateProductsSchema.body>;
