import { z, id, num, str } from '../../shared/middleware/zodHelpers';

const looseSaleIdParamSchema = z.object({
  id: z.union([id(), str().regex(/^\d+$/)]),
});

const createLooseSaleBodySchema = z.object({
  itemName: str().nullable().optional(),
  price: num().positive(),
});

const looseSalesReportQuerySchema = z.object({
  startDate: z.union([z.coerce.date(), str()]).optional(),
  endDate: z.union([z.coerce.date(), str()]).optional(),
});

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateLooseSaleInput = z.infer<typeof createLooseSaleBodySchema>;
export type LooseSaleIdParam = z.infer<typeof looseSaleIdParamSchema>;

export { looseSaleIdParamSchema, createLooseSaleBodySchema, looseSalesReportQuerySchema };
