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
