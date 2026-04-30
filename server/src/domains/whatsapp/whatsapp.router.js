const express = require('express');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const { sendBarcodeBodySchema, sendReceiptBodySchema, sendCapturedCardBodySchema } = require('./whatsapp.validation');
const whatsappController = require('./whatsapp.controller');

const router = express.Router();

router
  .route('/status')
  .get(asyncHandler(whatsappController.getStatus))
  .all(methodNotAllowed);

router
  .route('/browser-status')
  .get(asyncHandler(whatsappController.getBrowserStatus))
  .all(methodNotAllowed);

router
  .route('/install-browser')
  .post(asyncHandler(whatsappController.installBrowser))
  .all(methodNotAllowed);

router
  .route('/initialize')
  .post(asyncHandler(whatsappController.initialize))
  .all(methodNotAllowed);

router
  .route('/destroy')
  .post(asyncHandler(whatsappController.destroy))
  .all(methodNotAllowed);

router
  .route('/send-barcode')
  .post(
    validateRequest({ body: sendBarcodeBodySchema }),
    asyncHandler(whatsappController.sendBarcode)
  )
  .all(methodNotAllowed);

router
  .route('/send-receipt')
  .post(
    validateRequest({ body: sendReceiptBodySchema }),
    asyncHandler(whatsappController.sendReceipt)
  )
  .all(methodNotAllowed);

router
  .route('/send-captured-card')
  .post(
    validateRequest({ body: sendCapturedCardBodySchema }),
    asyncHandler(whatsappController.sendCapturedCard)
  )
  .all(methodNotAllowed);

module.exports = router;
