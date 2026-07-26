import { z, id, int, num, str, bool, looseObject } from '../../shared/middleware/zodHelpers';

const saleIdParamSchema = z.object({
  id: id(),
});

const saleItemSchema = z.object({
  batch_id: z.union([id(), str().min(1)]),
  // Batch.quantity and SaleItem.quantity are Int columns — a fractional value
  // reaches Prisma and surfaces as a 500. Weighted goods use loose sales
  // (/api/loose-sales), which are priced directly and carry no quantity.
  quantity: int().positive(),
  sellingPrice: num().min(0),
  isFree: bool().optional(),
});

const processSaleBodySchema = z.object({
  items: z.array(saleItemSchema).min(1),
  discount: num().min(0).optional(),
  extraDiscount: num().min(0).optional(),
  paymentMethod: str().nullable().optional(),
  paymentDetails: z.union([z.string().nullable(), looseObject()]).optional(),
  customerId: id().nullable().optional(),
});

const processReturnBodySchema = z.object({
  items: z
    .array(
      z.object({
        saleItemId: id(),
        quantity: int().positive(),
      })
    )
    .min(1),
});

export { saleIdParamSchema, processSaleBodySchema, processReturnBodySchema };
