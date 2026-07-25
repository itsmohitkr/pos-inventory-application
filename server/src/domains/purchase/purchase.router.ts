import express = require('express');
import purchaseController = require('./purchase.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  purchaseIdParamSchema,
  purchaseQuerySchema,
  purchaseBodySchema,
  purchaseUpdateBodySchema,
  paymentBodySchema,
} from './purchase.validation';

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

export = router;
