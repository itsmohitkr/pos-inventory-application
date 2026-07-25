const express = require('express');
const purchaseController = require('./purchase.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  purchaseIdParamSchema,
  purchaseQuerySchema,
  purchaseBodySchema,
  purchaseUpdateBodySchema,
  paymentBodySchema,
} = require('./purchase.validation');

const router = express.Router();

router
  .route('/')
  .post(
    validateRequest({ body: purchaseBodySchema }),
    purchaseController.createPurchase
  )
  .get(
    validateRequest({ query: purchaseQuerySchema }),
    purchaseController.getPurchases
  )
  .all(methodNotAllowed);
router
  .route('/:id')
  .put(
    validateRequest({ params: purchaseIdParamSchema, body: purchaseUpdateBodySchema }),
    purchaseController.updatePurchase
  )
  .delete(
    validateRequest({ params: purchaseIdParamSchema }),
    purchaseController.deletePurchase
  )
  .all(methodNotAllowed);
router
  .route('/:id/payments')
  .post(
    validateRequest({ params: purchaseIdParamSchema, body: paymentBodySchema }),
    purchaseController.addPayment
  )
  .all(methodNotAllowed);
router
  .route('/payments/:id')
  .put(
    validateRequest({ params: purchaseIdParamSchema, body: paymentBodySchema }),
    purchaseController.updatePayment
  )
  .delete(
    validateRequest({ params: purchaseIdParamSchema }),
    purchaseController.deletePayment
  )
  .all(methodNotAllowed);

module.exports = router;
