import {
  z,
  id,
  int,
  num,
  str,
  bool,
  looseObject,
  idParamSchema,
} from '../../shared/middleware/zodHelpers';

/** Shared by GetSaleById and ProcessReturn. */
const saleIdParamSchema = idParamSchema();

/** Exported as SaleItemInput directly, so it stays named rather than inlined. */
const saleItemSchema = z.object({
  batch_id: z.union([id(), str().min(1, 'Batch is required')]),
  // Batch.quantity and SaleItem.quantity are Int columns — a fractional value
  // reaches Prisma and surfaces as a 500. Weighted goods use loose sales
  // (/api/loose-sales), which are priced directly and carry no quantity.
  quantity: int().positive('Quantity must be greater than zero'),
  sellingPrice: num().min(0, 'Selling price must be zero or greater'),
  isFree: bool().optional(),
  freeGiftThresholdAmount: num().nullable().optional(),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const ProcessSaleSchema = {
  body: z.object({
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    discount: num().min(0, 'Discount must be zero or greater').optional(),
    extraDiscount: num().min(0, 'Extra discount must be zero or greater').optional(),
    paymentMethod: str().nullable().optional(),
    paymentDetails: z.union([z.string().nullable(), looseObject()]).optional(),
    customerId: id().nullable().optional(),
  }),
};

export const GetSaleByIdSchema = { params: saleIdParamSchema };

export const ProcessReturnSchema = {
  params: saleIdParamSchema,
  body: z.object({
    items: z
      .array(
        z.object({
          saleItemId: id(),
          quantity: int().positive('Quantity must be greater than zero'),
        })
      )
      .min(1, 'At least one item is required'),
  }),
};

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type ProcessSaleInput = z.infer<typeof ProcessSaleSchema.body>;
export type ProcessReturnInput = z.infer<typeof ProcessReturnSchema.body>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
