const { Joi } = require('../../shared/middleware/validateRequest');

const dateRangeQuerySchema = Joi.object({
    startDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional(),
    endDate: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim()).optional()
});

const monthlySalesQuerySchema = Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional()
});

const dailySalesQuerySchema = Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    month: Joi.number().integer().min(0).max(11).optional()
});

module.exports = {
    dateRangeQuerySchema,
    monthlySalesQuerySchema,
    dailySalesQuerySchema
};
