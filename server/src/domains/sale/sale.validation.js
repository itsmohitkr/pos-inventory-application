const { Joi } = require('../../shared/middleware/validateRequest');

const saleIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const saleItemSchema = Joi.object({
  batch_id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().trim().min(1))
    .required(),
  quantity: Joi.number().positive().required(),
  sellingPrice: Joi.number().min(0).required(),
  isFree: Joi.boolean().optional(),
});

const processSaleBodySchema = Joi.object({
  items: Joi.array().items(saleItemSchema).min(1).required(),
  discount: Joi.number().min(0).optional(),
  extraDiscount: Joi.number().min(0).optional(),
  paymentMethod: Joi.string().trim().allow('', null).optional(),
  paymentDetails: Joi.alternatives()
    .try(Joi.string().allow('', null), Joi.object().unknown(true))
    .optional(),
  customerId: Joi.number().integer().positive().optional().allow(null),
});

const processReturnBodySchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        saleItemId: Joi.number().integer().positive().required(),
        quantity: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  saleIdParamSchema,
  processSaleBodySchema,
  processReturnBodySchema,
};
