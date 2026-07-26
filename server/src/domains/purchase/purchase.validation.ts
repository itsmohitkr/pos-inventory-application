import { z, id, int, num, str, bool, looseObject } from '../../shared/middleware/zodHelpers';

const moneyValue = () => num().min(0);

const purchaseIdParamSchema = z.object({ id: id() });

const purchaseQuerySchema = z.looseObject({
  startDate: z.union([z.coerce.date(), str()]).optional(),
  endDate: z.union([z.coerce.date(), str()]).optional(),
  vendor: str().nullable().optional(),
});

const purchaseItemSchema = z.object({
  productId: z.union([id(), str().min(1)]),
  batchId: z.union([id(), str(), z.null()]).optional(),
  quantity: int().min(0),
  costPrice: moneyValue().optional(),
});

const purchaseFields = {
  vendor: z.string().nullable().optional(),
  date: z.union([z.coerce.date(), str().min(1)]).optional(),
  note: z.string().nullable().optional(),
  paidAmount: moneyValue().optional(),
  paymentMethod: str().nullable().optional(),
  paymentStatus: str().nullable().optional(),
  items: z.array(purchaseItemSchema).optional(),
};

const purchaseBodySchema = z.object({
  ...purchaseFields,
  totalAmount: moneyValue(),
});

const purchaseUpdateBodySchema = z
  .object({ ...purchaseFields, totalAmount: moneyValue().optional() })
  .refine((v) => Object.keys(v).length >= 1, {
    message: 'at least one field is required',
  });

const paymentBodySchema = z.object({
  amount: moneyValue(),
  date: z.union([z.coerce.date(), str().min(1)]).optional(),
  note: z.string().nullable().optional(),
  paymentMethod: str().nullable().optional(),
});

export {
  purchaseIdParamSchema,
  purchaseQuerySchema,
  purchaseBodySchema,
  purchaseUpdateBodySchema,
  paymentBodySchema,
};
