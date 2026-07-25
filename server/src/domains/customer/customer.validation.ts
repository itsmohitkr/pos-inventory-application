import { Joi } from '../../shared/middleware/validateRequest';

const customerIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const barcodeParamSchema = Joi.object({
  barcode: Joi.string().pattern(/^CUST-[A-Z0-9]{8}$/).required(),
});

const phoneParamSchema = Joi.object({
  phone: Joi.string().min(7).max(15).required(),
});

const findOrCreateBodySchema = Joi.object({
  phone: Joi.string().min(7).max(15).required(),
  name: Joi.string().trim().max(100).optional().allow('', null),
});

const updateCustomerBodySchema = Joi.object({
  phone: Joi.string().min(7).max(15).optional(),
  name: Joi.string().trim().max(100).optional().allow('', null),
});

export {
  customerIdParamSchema,
  barcodeParamSchema,
  phoneParamSchema,
  findOrCreateBodySchema,
  updateCustomerBodySchema,
};
