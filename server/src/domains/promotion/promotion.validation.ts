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
  promoPrice: num().min(0),
  discountPercentage: num().min(0).max(100).optional(),
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

/** One grouped schema per router route, named after the controller handler it validates for. */
export const CreatePromotionSchema = { body: promotionBodySchema };
export const UpdatePromotionSchema = { params: promotionIdParamSchema, body: promotionBodySchema };
export const DeletePromotionSchema = { params: promotionIdParamSchema };
export const GetProductPricingOptionsSchema = { params: productIdParamSchema };
export const GetEffectivePromoPriceSchema = { params: productIdParamSchema };
