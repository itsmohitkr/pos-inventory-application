const { Joi } = require('../../shared/middleware/validateRequest');

const keyValueSettingsSchema = Joi.object({
    key: Joi.string().trim().min(1).required(),
    value: Joi.any().required()
});

const bulkSettingsSchema = Joi.object({
    settings: Joi.object()
        .pattern(Joi.string().trim().min(1), Joi.any())
        .min(1)
        .required()
});

const updateSettingsBodySchema = Joi.alternatives().try(
    bulkSettingsSchema,
    keyValueSettingsSchema
);

module.exports = {
    updateSettingsBodySchema
};
