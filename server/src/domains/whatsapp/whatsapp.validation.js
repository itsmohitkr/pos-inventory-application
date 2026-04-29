const { Joi } = require('../../shared/middleware/validateRequest');

const sendBarcodeBodySchema = Joi.object({
  phone: Joi.string().min(7).max(15).required(),
  barcode: Joi.string().pattern(/^CUST-[A-Z0-9]{8}$/).required(),
  shopName: Joi.string().max(100).optional().allow('', null),
  customerName: Joi.string().max(100).optional().allow('', null),
});

const sendReceiptBodySchema = Joi.object({
  phone: Joi.string().min(7).max(15).required(),
  sale: Joi.object().required(),
  shopName: Joi.string().max(100).optional().allow('', null),
});

const sendCapturedCardBodySchema = Joi.object({
  phone: Joi.string().min(7).max(15).required(),
  base64Image: Joi.string().max(5_000_000).required(),
  caption: Joi.string().max(1024).optional().allow('', null),
});

module.exports = { sendBarcodeBodySchema, sendReceiptBodySchema, sendCapturedCardBodySchema };
