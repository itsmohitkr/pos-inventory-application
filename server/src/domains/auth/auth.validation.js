const { Joi } = require('../../shared/middleware/validateRequest');

const userIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

const profileQuerySchema = Joi.object({
    userId: Joi.number().integer().positive().required()
});

const loginBodySchema = Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    password: Joi.string().min(1).max(255).required()
});

const createUserBodySchema = Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    password: Joi.string().min(1).max(255).required(),
    role: Joi.string().trim().valid('admin', 'cashier', 'salesman').optional()
});

const updateUserBodySchema = Joi.object({
    role: Joi.string().trim().valid('admin', 'cashier', 'salesman').optional(),
    status: Joi.string().trim().valid('active', 'inactive').optional(),
    password: Joi.string().min(1).max(255).optional()
}).min(1);

const changePasswordBodySchema = Joi.object({
    oldPassword: Joi.string().min(1).required(),
    newPassword: Joi.string().min(1).max(255).required()
});

const verifyAdminBodySchema = Joi.object({
    password: Joi.string().min(1).required()
});

const wipeDatabaseBodySchema = Joi.object({
    username: Joi.string().trim().min(1).required(),
    password: Joi.string().min(1).max(255).required()
});

module.exports = {
    userIdParamSchema,
    profileQuerySchema,
    loginBodySchema,
    createUserBodySchema,
    updateUserBodySchema,
    changePasswordBodySchema,
    verifyAdminBodySchema,
    wipeDatabaseBodySchema
};
