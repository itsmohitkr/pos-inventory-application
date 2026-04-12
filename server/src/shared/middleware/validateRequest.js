const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');
const { createHttpError } = require('../error/appError');

const DEFAULT_OPTIONS = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
  convert: true,
};

const formatValidationDetails = (details = []) => {
  return details.map((detail) => ({
    message: detail.message.replace(/\"/g, ''),
    path: detail.path.join('.'),
    type: detail.type,
  }));
};

const validateRequest = (schemas = {}, options = {}) => {
  return (req, _res, next) => {
    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const { error, value } = schema.validate(req[target], {
        ...DEFAULT_OPTIONS,
        ...options,
      });

      if (error) {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, 'Validation failed', {
            name: 'ValidationError',
            error: 'Validation failed',
            details: formatValidationDetails(error.details),
          })
        );
      }

      if (value !== undefined) {
        req[target] = value;
      }
    }

    return next();
  };
};

module.exports = {
  validateRequest,
  Joi,
};
