import { z, num, str, numericId, dateRangeShape } from '../../shared/middleware/zodHelpers';

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreateLooseSaleSchema = {
  body: z.object({
    itemName: str().nullable().optional(),
    price: num().positive('Price must be greater than zero'),
  }),
};

export const GetLooseSalesReportSchema = {
  query: z.object({ ...dateRangeShape() }),
};

export const DeleteLooseSaleSchema = {
  params: z.object({
    id: numericId(),
  }),
};

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type CreateLooseSaleInput = z.infer<typeof CreateLooseSaleSchema.body>;
export type LooseSaleIdParam = z.infer<typeof DeleteLooseSaleSchema.params>;
