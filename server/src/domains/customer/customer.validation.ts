import { z, str, idParamSchema } from '../../shared/middleware/zodHelpers';

const customerIdParamSchema = idParamSchema();

const barcodeParamSchema = z.object({
  barcode: z.string().regex(/^CUST-[A-Z0-9]{8}$/, 'Invalid customer barcode'),
});

const phoneParamSchema = z.object({
  phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long'),
});

const findOrCreateBodySchema = z.object({
  phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long'),
  name: str().max(100, 'Name is too long').nullable().optional(),
});

const updateCustomerBodySchema = z.object({
  phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long').optional(),
  name: str().max(100, 'Name is too long').nullable().optional(),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const FindOrCreateSchema = { body: findOrCreateBodySchema };
export const GetByBarcodeSchema = { params: barcodeParamSchema };
export const GetByPhoneSchema = { params: phoneParamSchema };
export const GetCustomerByIdSchema = { params: customerIdParamSchema };
export const UpdateCustomerSchema = { params: customerIdParamSchema, body: updateCustomerBodySchema };
export const GetPurchaseHistorySchema = { params: customerIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type FindOrCreateCustomerInput = z.infer<typeof FindOrCreateSchema.body>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema.body>;
