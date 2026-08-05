import { z, num, str, bool, numericId } from '../../shared/middleware/zodHelpers';

const promotionIdParamSchema = z.object({ id: numericId() });

const productIdParamSchema = z.object({ productId: numericId() });

const promotionItemSchema = z.object({
  productId: numericId(),
  // NOT optional: PromotionItem.promoPrice is a non-nullable Float column
  // with no default. The previous schema allowed submitting
  // discountPercentage alone (Joi's `.or()`), but nothing ever computed a
  // promoPrice from it in that case — the client always sends an explicit
  // promoPrice, and no test exercises the percentage-only path.
  // discountPercentage is stored alongside it for display only.
  promoPrice: num().min(0, 'Promo price must be zero or greater'),
  discountPercentage: num().min(0, 'Discount must be zero or greater').max(100, 'Discount cannot exceed 100%').optional(),
});

const promotionBodySchema = z.object({
  name: str().min(1, 'Promotion name is required').max(150, 'Promotion name is too long'),
  startDate: z.union([z.coerce.date(), str().min(1, 'Start date is required')]),
  endDate: z.union([z.coerce.date(), str().min(1, 'End date is required')]),
  items: z.array(promotionItemSchema).min(1, 'At least one product is required'),
  isActive: bool().optional(),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreatePromotionSchema = { body: promotionBodySchema };
export const UpdatePromotionSchema = { params: promotionIdParamSchema, body: promotionBodySchema };
export const DeletePromotionSchema = { params: promotionIdParamSchema };
export const GetProductPricingOptionsSchema = { params: productIdParamSchema };
export const GetEffectivePromoPriceSchema = { params: productIdParamSchema };

/**
 * Service input type derived from the schema above, so the validated shape and
 * the type the service declares cannot drift apart.
 */
export type PromotionInput = z.infer<typeof CreatePromotionSchema.body>;
