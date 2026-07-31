import {
  z,
  id,
  int,
  str,
  idParamSchema,
  dateRangeShape,
  moneyValue,
  paymentBodySchema as paymentBodySchemaFactory,
  atLeastOneField,
  AT_LEAST_ONE_FIELD_MESSAGE,
} from '../../shared/middleware/zodHelpers';

const purchaseIdParamSchema = idParamSchema();

const purchaseQuerySchema = z.looseObject({
  ...dateRangeShape(),
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
  // NOT nullable: Purchase.paymentStatus is a non-nullable String column with
  // a default. A `null` here previously passed validation and would have
  // reached Prisma as a null write to a required field.
  paymentStatus: str().optional(),
  items: z.array(purchaseItemSchema).optional(),
};

const purchaseBodySchema = z.object({
  ...purchaseFields,
  totalAmount: moneyValue(),
});

const purchaseUpdateBodySchema = z
  .object({ ...purchaseFields, totalAmount: moneyValue().optional() })
  .refine(atLeastOneField, {
    message: AT_LEAST_ONE_FIELD_MESSAGE,
  });

const paymentBodySchema = paymentBodySchemaFactory();

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreatePurchaseInput = z.infer<typeof purchaseBodySchema>;
export type UpdatePurchaseInput = z.infer<typeof purchaseUpdateBodySchema>;
export type PurchasePaymentInput = z.infer<typeof paymentBodySchema>;

export {
  purchaseIdParamSchema,
  purchaseQuerySchema,
  purchaseBodySchema,
  purchaseUpdateBodySchema,
  paymentBodySchema,
};
