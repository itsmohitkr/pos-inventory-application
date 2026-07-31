import { z, num, str, numericId, dateRangeShape } from '../../shared/middleware/zodHelpers';

const looseSaleIdParamSchema = z.object({
  id: numericId(),
});

const createLooseSaleBodySchema = z.object({
  itemName: str().nullable().optional(),
  price: num().positive(),
});

const looseSalesReportQuerySchema = z.object({ ...dateRangeShape() });

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateLooseSaleSchema = { body: createLooseSaleBodySchema };
export const GetLooseSalesReportSchema = { query: looseSalesReportQuerySchema };
export const DeleteLooseSaleSchema = { params: looseSaleIdParamSchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateLooseSaleInput = z.infer<typeof CreateLooseSaleSchema.body>;
export type LooseSaleIdParam = z.infer<typeof DeleteLooseSaleSchema.params>;
