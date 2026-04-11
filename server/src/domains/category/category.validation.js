const { Joi } = require('../../shared/middleware/validateRequest');

const categoryIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

const createCategoryBodySchema = Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    parentId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.valid(null),
        Joi.string().allow('', null)
    ).optional()
});

const updateCategoryBodySchema = Joi.object({
    name: Joi.string().trim().min(1).max(120).required()
});

module.exports = {
    categoryIdParamSchema,
    createCategoryBodySchema,
    updateCategoryBodySchema
};
