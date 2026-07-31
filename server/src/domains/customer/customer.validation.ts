import { z, str, idParamSchema } from '../../shared/middleware/zodHelpers';

const customerIdParamSchema = idParamSchema();

const barcodeParamSchema = z.object({
  barcode: z.string().regex(/^CUST-[A-Z0-9]{8}$/),
});

const phoneParamSchema = z.object({
  phone: z.string().min(7).max(15),
});

const findOrCreateBodySchema = z.object({
  phone: z.string().min(7).max(15),
  name: str().max(100).nullable().optional(),
});

const updateCustomerBodySchema = z.object({
  phone: z.string().min(7).max(15).optional(),
  name: str().max(100).nullable().optional(),
});

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type FindOrCreateCustomerInput = z.infer<typeof findOrCreateBodySchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerBodySchema>;

export {
  customerIdParamSchema,
  barcodeParamSchema,
  phoneParamSchema,
  findOrCreateBodySchema,
  updateCustomerBodySchema,
};

/** One grouped schema per router route, named after the controller handler it validates for. */
export const FindOrCreateSchema = { body: findOrCreateBodySchema };
export const GetByBarcodeSchema = { params: barcodeParamSchema };
export const GetByPhoneSchema = { params: phoneParamSchema };
export const GetCustomerByIdSchema = { params: customerIdParamSchema };
export const UpdateCustomerSchema = { params: customerIdParamSchema, body: updateCustomerBodySchema };
export const GetPurchaseHistorySchema = { params: customerIdParamSchema };
