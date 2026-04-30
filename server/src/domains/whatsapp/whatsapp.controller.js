const { StatusCodes } = require('http-status-codes');
const whatsappService = require('./whatsapp.service');
const chromium = require('./chromium');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const getStatus = async (_req, res) => {
  const status = whatsappService.getConnectionStatus();
  return sendSuccessResponse(res, StatusCodes.OK, status, 'WhatsApp status', { format: 'raw' });
};

const getBrowserStatus = async (_req, res) => {
  const status = chromium.getInstallStatus();
  return sendSuccessResponse(res, StatusCodes.OK, status, 'Browser install status', { format: 'raw' });
};

// Kicks off the chrome-headless-shell download. Returns immediately so the
// frontend can poll /browser-status for progress. Idempotent — if the install
// is already running or complete, it's a no-op.
const installBrowser = async (_req, res) => {
  // Don't await — we want the HTTP response back immediately.
  chromium.installBrowser().catch((err) => {
    logger.error({ err: err.message }, 'Browser install failed');
  });
  return sendSuccessResponse(
    res,
    StatusCodes.ACCEPTED,
    { message: 'Browser install started' },
    'Started',
    { format: 'raw' }
  );
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

module.exports = {
  getStatus,
  getBrowserStatus,
  installBrowser,
  initialize,
  destroy,
  sendBarcode,
  sendReceipt,
  sendCapturedCard,
};
