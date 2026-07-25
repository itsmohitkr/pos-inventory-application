const express = require('express');
const saleController = require('./sale.controller');
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
  .post(validateRequest({ body: processSaleBodySchema }), saleController.processSale)
  .all(methodNotAllowed);
router
  .route('/sale/:id')
  .get(validateRequest({ params: saleIdParamSchema }), saleController.getSaleById)
  .all(methodNotAllowed);
router
  .route('/sale/:id/return')
  .post(
    validateRequest({ params: saleIdParamSchema, body: processReturnBodySchema }),
    saleController.processReturn
  )
  .all(methodNotAllowed);

module.exports = router;
