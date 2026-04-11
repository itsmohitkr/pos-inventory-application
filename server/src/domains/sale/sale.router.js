const express = require('express');
const saleController = require('./sale.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  saleIdParamSchema,
  processSaleBodySchema,
  processReturnBodySchema,
} = require('./sale.validation');

const router = express.Router();

router
  .route('/sale')
  .post(validateRequest({ body: processSaleBodySchema }), asyncHandler(saleController.processSale))
  .all(methodNotAllowed);
router
  .route('/sale/:id')
  .get(validateRequest({ params: saleIdParamSchema }), asyncHandler(saleController.getSaleById))
  .all(methodNotAllowed);
router
  .route('/sale/:id/return')
  .post(
    validateRequest({ params: saleIdParamSchema, body: processReturnBodySchema }),
    asyncHandler(saleController.processReturn)
  )
  .all(methodNotAllowed);

module.exports = router;
