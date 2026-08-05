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

/** Shared by UpdatePurchase, DeletePurchase, AddPayment, UpdatePayment, DeletePayment. */
const purchaseIdParamSchema = idParamSchema();

const purchaseItemSchema = z.object({
  productId: z.union([id(), str().min(1, 'Product is required')]),
  batchId: z.union([id(), str(), z.null()]).optional(),
  quantity: int().min(0, 'Quantity must be zero or greater'),
  costPrice: moneyValue().optional(),
});

/** Shared by CreatePurchase and UpdatePurchase — only totalAmount's optionality differs. */
const purchaseFields = {
  vendor: z.string().nullable().optional(),
  date: z.union([z.coerce.date(), str().min(1, 'Date is required')]).optional(),
  note: z.string().nullable().optional(),
  paidAmount: moneyValue().optional(),
  paymentMethod: str().nullable().optional(),
  // NOT nullable: Purchase.paymentStatus is a non-nullable String column with
  // a default. A `null` here previously passed validation and would have
  // reached Prisma as a null write to a required field.
  paymentStatus: str().optional(),
  items: z.array(purchaseItemSchema).optional(),
};

/** Shared by AddPayment and UpdatePayment. */
const paymentBodySchema = paymentBodySchemaFactory();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreatePurchaseSchema = {
  body: z.object({
    ...purchaseFields,
    totalAmount: moneyValue(),
  }),
};

export const GetPurchasesSchema = {
  query: z.looseObject({
    ...dateRangeShape(),
    vendor: str().nullable().optional(),
  }),
};

export const UpdatePurchaseSchema = {
  params: purchaseIdParamSchema,
  body: z
    .object({ ...purchaseFields, totalAmount: moneyValue().optional() })
    .refine(atLeastOneField, {
      message: AT_LEAST_ONE_FIELD_MESSAGE,
    }),
};

export const DeletePurchaseSchema = { params: purchaseIdParamSchema };
export const AddPaymentSchema = { params: purchaseIdParamSchema, body: paymentBodySchema };
export const UpdatePaymentSchema = { params: purchaseIdParamSchema, body: paymentBodySchema };
export const DeletePaymentSchema = { params: purchaseIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema.body>;
export type UpdatePurchaseInput = z.infer<typeof UpdatePurchaseSchema.body>;
export type PurchasePaymentInput = z.infer<typeof AddPaymentSchema.body>;
