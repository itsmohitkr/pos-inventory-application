const { Joi } = require('../../shared/middleware/validateRequest');

const looseSaleIdParamSchema = Joi.object({
  id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().trim().pattern(/^\d+$/))
    .required(),
});

const createLooseSaleBodySchema = Joi.object({
  itemName: Joi.string().trim().allow('', null).optional(),
  price: Joi.number().positive().required(),
});

const looseSalesReportQuerySchema = Joi.object({
  startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
  endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
});

module.exports = {
  looseSaleIdParamSchema,
  createLooseSaleBodySchema,
  looseSalesReportQuerySchema,
};
