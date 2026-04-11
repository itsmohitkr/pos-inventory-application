const { Joi } = require('../../shared/middleware/validateRequest');

const expenseIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

const moneyValue = Joi.number().min(0);

const expenseBodySchema = Joi.object({
    amount: moneyValue.required(),
    category: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().allow('', null).optional(),
    date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
    paidAmount: moneyValue.optional(),
    paymentMethod: Joi.string().trim().allow('', null).optional(),
    paymentStatus: Joi.string().trim().allow('', null).optional()
});

const expenseUpdateBodySchema = Joi.object({
    amount: moneyValue.optional(),
    category: Joi.string().trim().min(1).max(120).optional(),
    description: Joi.string().allow('', null).optional(),
    date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
    paidAmount: moneyValue.optional(),
    paymentMethod: Joi.string().trim().allow('', null).optional(),
    paymentStatus: Joi.string().trim().allow('', null).optional()
}).min(1);

const paymentBodySchema = Joi.object({
    amount: moneyValue.required(),
    date: Joi.alternatives().try(Joi.date().iso(), Joi.string().trim().min(1)).optional(),
    note: Joi.string().allow('', null).optional(),
    paymentMethod: Joi.string().trim().allow('', null).optional()
});

module.exports = {
    expenseIdParamSchema,
    expenseBodySchema,
    expenseUpdateBodySchema,
    paymentBodySchema
};
