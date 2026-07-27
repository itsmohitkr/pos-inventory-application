import { z, id, str } from '../../shared/middleware/zodHelpers';

const customerIdParamSchema = z.object({
  id: id(),
});

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

export {
  customerIdParamSchema,
  barcodeParamSchema,
  phoneParamSchema,
  findOrCreateBodySchema,
  updateCustomerBodySchema,
};
