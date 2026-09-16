import {
  z,
  str,
  idParamSchema,
  atLeastOneField,
  AT_LEAST_ONE_FIELD_MESSAGE,
} from '../../shared/middleware/zodHelpers';

/** Shared by GetVendorById and UpdateVendor. */
const vendorIdParamSchema = idParamSchema();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const FindOrCreateVendorSchema = {
  body: z.object({
    name: str().min(1, 'Vendor name is required').max(150, 'Vendor name is too long'),
    phone: str().max(20, 'Phone number is too long').nullable().optional(),
    address: str().max(300, 'Address is too long').nullable().optional(),
  }),
};

export const GetAllVendorsSchema = {
  query: z.looseObject({
    page: str().optional(),
    limit: str().optional(),
    search: str().optional(),
  }),
};

export const GetVendorByIdSchema = { params: vendorIdParamSchema };

export const UpdateVendorSchema = {
  params: vendorIdParamSchema,
  body: z
    .object({
      name: str().min(1, 'Vendor name is required').max(150, 'Vendor name is too long').optional(),
      phone: str().max(20, 'Phone number is too long').nullable().optional(),
      address: str().max(300, 'Address is too long').nullable().optional(),
    })
    .refine(atLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE }),
};

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type FindOrCreateVendorInput = z.infer<typeof FindOrCreateVendorSchema.body>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema.body>;
