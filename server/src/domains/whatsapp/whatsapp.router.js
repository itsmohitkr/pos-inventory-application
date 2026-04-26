const express = require('express');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const { sendBarcodeBodySchema, sendReceiptBodySchema } = require('./whatsapp.validation');
const whatsappService = require('./whatsapp.service');
const { StatusCodes } = require('http-status-codes');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const router = express.Router();

router
  .route('/status')
  .get(
    asyncHandler(async (_req, res) => {
      const status = whatsappService.getConnectionStatus();
      return sendSuccessResponse(res, StatusCodes.OK, status, 'WhatsApp status', { format: 'raw' });
    })
  )
  .all(methodNotAllowed);

router
  .route('/initialize')
  .post(
    asyncHandler(async (_req, res) => {
      await whatsappService.initializeClient();
      return sendSuccessResponse(res, StatusCodes.OK, { message: 'Initialization started' }, 'OK', { format: 'raw' });
    })
  )
  .all(methodNotAllowed);

router
  .route('/destroy')
  .post(
    asyncHandler(async (_req, res) => {
      await whatsappService.destroyClient();
      return sendSuccessResponse(res, StatusCodes.OK, { message: 'Client disconnected' }, 'OK', { format: 'raw' });
    })
  )
  .all(methodNotAllowed);

router
  .route('/send-barcode')
  .post(
    validateRequest({ body: sendBarcodeBodySchema }),
    asyncHandler(async (req, res) => {
      try {
        await whatsappService.sendCustomerBarcode(req.body);
        return sendSuccessResponse(res, StatusCodes.OK, { sent: true }, 'Barcode sent', { format: 'raw' });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to send barcode via WhatsApp');
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    })
  )
  .all(methodNotAllowed);

router
  .route('/send-receipt')
  .post(
    validateRequest({ body: sendReceiptBodySchema }),
    asyncHandler(async (req, res) => {
      try {
        await whatsappService.sendSaleReceipt(req.body);
        return sendSuccessResponse(res, StatusCodes.OK, { sent: true }, 'Receipt sent', { format: 'raw' });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to send receipt via WhatsApp');
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    })
  )
  .all(methodNotAllowed);

router
  .route('/send-captured-card')
  .post(
    asyncHandler(async (req, res) => {
      const { phone, base64Image, caption } = req.body;
      logger.info({ phone }, 'Sending captured visual customer card');
      try {
        const whatsappService = require('./whatsapp.service');
        await whatsappService.sendCapturedCard({ phone, base64Image, caption });
        return res.status(StatusCodes.OK).json({ success: true });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to send captured customer card');
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    })
  )
  .all(methodNotAllowed);

module.exports = router;
