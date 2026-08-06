import { z, str, num, bool, id } from '../../shared/middleware/zodHelpers';

const categorySaleBodySchema = z
  .object({
    name: str().min(1, 'Sale name is required'),
    category: str().min(1, 'Category is required'),
    discountPercentage: num()
      .min(0.01, 'Discount percentage must be greater than 0')
      .max(100, 'Discount percentage cannot exceed 100'),
    isIndefinite: bool().default(false),
    startDate: str().nullable().optional(),
    endDate: str().nullable().optional(),
    status: z.enum(['draft', 'active', 'paused']).default('draft'),
    excludedProductIds: z.array(z.number()).optional(),
    // Admin-gated per-product override — see requireAdmin usage in
    // category-sale.router.ts, which only kicks in when this array is
    // non-empty. Deliberately bypasses the automatic margin floor (the
    // reason is required precisely because that's a conscious choice, e.g.
    // a festival clearance sold below cost).
    productOverrides: z
      .array(
        z.object({
          productId: id(),
          discountPercentage: num()
            .min(0, 'Discount percentage must be zero or greater')
            .max(100, 'Discount percentage cannot exceed 100'),
          reason: str().min(3, 'A reason is required').max(200, 'Reason is too long'),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.isIndefinite && data.status !== 'draft') {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    {
      message: 'Start date and end date are required for scheduled sales',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (!data.isIndefinite && data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

const categorySaleIdParamSchema = z.object({
  id: id(),
});

const statusToggleSchema = z.object({
  status: z.enum(['draft', 'active', 'paused']),
});

const previewQuerySchema = z.object({
  category: str().min(1, 'Category is required'),
  discountPercentage: num().min(0.01).max(100),
});

export const CreateCategorySaleSchema = { body: categorySaleBodySchema };
export const UpdateCategorySaleSchema = {
  params: categorySaleIdParamSchema,
  body: categorySaleBodySchema,
};
export const DeleteCategorySaleSchema = { params: categorySaleIdParamSchema };
export const ToggleCategorySaleStatusSchema = {
  params: categorySaleIdParamSchema,
  body: statusToggleSchema,
};
export const PreviewCategorySaleSchema = { query: previewQuerySchema };

export type CategorySaleInput = z.infer<typeof categorySaleBodySchema>;
