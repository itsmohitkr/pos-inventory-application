const { StatusCodes } = require('http-status-codes');
const whatsappService = require('./whatsapp.service');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const getStatus = async (_req, res) => {
  const status = whatsappService.getConnectionStatus();
  return sendSuccessResponse(res, StatusCodes.OK, status, 'WhatsApp status', { format: 'raw' });
};

const initialize = async (_req, res) => {
  await whatsappService.initializeClient();
  return sendSuccessResponse(res, StatusCodes.OK, { message: 'Initialization started' }, 'OK', { format: 'raw' });
};

const destroy = async (_req, res) => {
  await whatsappService.destroyClient();
  return sendSuccessResponse(res, StatusCodes.OK, { message: 'Client disconnected' }, 'OK', { format: 'raw' });
};

const sendBarcode = async (req, res) => {
  try {
    await whatsappService.sendCustomerBarcode(req.body);
    return sendSuccessResponse(res, StatusCodes.OK, { sent: true }, 'Barcode sent', { format: 'raw' });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to send barcode via WhatsApp');
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

const sendReceipt = async (req, res) => {
  try {
    await whatsappService.sendSaleReceipt(req.body);
    return sendSuccessResponse(res, StatusCodes.OK, { sent: true }, 'Receipt sent', { format: 'raw' });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to send receipt via WhatsApp');
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

const sendCapturedCard = async (req, res) => {
  const { phone, base64Image, caption } = req.body;
  logger.info({ phoneTail: phone.slice(-4) }, 'Sending captured visual customer card');
  try {
    await whatsappService.sendCapturedCard({ phone, base64Image, caption });
    return sendSuccessResponse(res, StatusCodes.OK, { sent: true }, 'Card sent', { format: 'raw' });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to send captured customer card');
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

module.exports = { getStatus, initialize, destroy, sendBarcode, sendReceipt, sendCapturedCard };
