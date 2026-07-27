import { z, id, num, str, bool } from '../../shared/middleware/zodHelpers';

const numericId = z.union([id(), str().regex(/^\d+$/)]);

const promotionIdParamSchema = z.object({ id: numericId });

const productIdParamSchema = z.object({ productId: numericId });

const promotionItemSchema = z
  .object({
    productId: numericId,
    promoPrice: num().min(0).nullable().optional(),
    discountPercentage: num().min(0).max(100).nullable().optional(),
  })
  // Joi's .or('promoPrice', 'discountPercentage') — at least one required.
  .refine((v) => v.promoPrice != null || v.discountPercentage != null, {
    message: 'one of promoPrice or discountPercentage is required',
  });

const promotionBodySchema = z.object({
  name: str().min(1).max(150),
  startDate: z.union([z.coerce.date(), str().min(1)]),
  endDate: z.union([z.coerce.date(), str().min(1)]),
  items: z.array(promotionItemSchema).min(1),
  isActive: bool().optional(),
});

/**
 * Service input type derived from the schema above, so the validated shape and
 * the type the service declares cannot drift apart.
 */
export type PromotionInput = z.infer<typeof promotionBodySchema>;

export { promotionIdParamSchema, productIdParamSchema, promotionBodySchema };
