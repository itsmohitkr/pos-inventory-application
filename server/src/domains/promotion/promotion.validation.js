const { Joi } = require('../../shared/middleware/validateRequest');

const numericId = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().trim().pattern(/^\d+$/)
);

const promotionIdParamSchema = Joi.object({
  id: numericId.required(),
});

const productIdParamSchema = Joi.object({
  productId: numericId.required(),
});

const promotionItemSchema = Joi.object({
  productId: numericId.required(),
  promoPrice: Joi.number().min(0).allow(null).optional(),
  discountPercentage: Joi.number().min(0).max(100).allow(null).optional(),
}).or('promoPrice', 'discountPercentage');

const promotionBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).required(),
  endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).required(),
  items: Joi.array().items(promotionItemSchema).min(1).required(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  promotionIdParamSchema,
  productIdParamSchema,
  promotionBodySchema,
};
