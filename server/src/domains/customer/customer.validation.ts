import { z, str, idParamSchema } from '../../shared/middleware/zodHelpers';

/** Shared by GetCustomerById, UpdateCustomer, GetPurchaseHistory. */
const customerIdParamSchema = idParamSchema();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const FindOrCreateSchema = {
  body: z.object({
    phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long'),
    name: str().max(100, 'Name is too long').nullable().optional(),
  }),
};

export const GetByBarcodeSchema = {
  params: z.object({
    barcode: z.string().regex(/^CUST-[A-Z0-9]{8}$/, 'Invalid customer barcode'),
  }),
};

export const GetByPhoneSchema = {
  params: z.object({
    phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long'),
  }),
};

export const GetCustomerByIdSchema = { params: customerIdParamSchema };

export const UpdateCustomerSchema = {
  params: customerIdParamSchema,
  body: z.object({
    phone: z.string().min(7, 'Phone number is too short').max(15, 'Phone number is too long').optional(),
    name: str().max(100, 'Name is too long').nullable().optional(),
  }),
};

export const GetPurchaseHistorySchema = { params: customerIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type FindOrCreateCustomerInput = z.infer<typeof FindOrCreateSchema.body>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema.body>;
