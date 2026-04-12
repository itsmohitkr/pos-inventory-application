const { Joi } = require('../../shared/middleware/validateRequest');

const purchaseIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const moneyValue = Joi.number().min(0);

const purchaseQuerySchema = Joi.object({
  startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
  endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
  vendor: Joi.string().trim().allow('', null).optional(),
}).unknown(true);

const purchaseItemSchema = Joi.object({
  productId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().trim().min(1))
    .required(),
  batchId: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().trim().min(1),
      Joi.valid(null),
      Joi.string().allow('')
    )
    .optional(),
  quantity: Joi.number().integer().min(0).required(),
  costPrice: moneyValue.optional(),
});

const purchaseBodySchema = Joi.object({
  vendor: Joi.string().allow('', null).optional(),
  totalAmount: moneyValue.required(),
  date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
  note: Joi.string().allow('', null).optional(),
  paidAmount: moneyValue.optional(),
  paymentMethod: Joi.string().trim().allow('', null).optional(),
  paymentStatus: Joi.string().trim().allow('', null).optional(),
  items: Joi.array().items(purchaseItemSchema).optional(),
});

const purchaseUpdateBodySchema = Joi.object({
  vendor: Joi.string().allow('', null).optional(),
  totalAmount: moneyValue.optional(),
  date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
  note: Joi.string().allow('', null).optional(),
  paidAmount: moneyValue.optional(),
  paymentMethod: Joi.string().trim().allow('', null).optional(),
  paymentStatus: Joi.string().trim().allow('', null).optional(),
  items: Joi.array().items(purchaseItemSchema).optional(),
}).min(1);

const paymentBodySchema = Joi.object({
  amount: moneyValue.required(),
  date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
  note: Joi.string().allow('', null).optional(),
  paymentMethod: Joi.string().trim().allow('', null).optional(),
});

module.exports = {
  purchaseIdParamSchema,
  purchaseQuerySchema,
  purchaseBodySchema,
  purchaseUpdateBodySchema,
  paymentBodySchema,
};
