import express = require('express');
import purchaseController = require('./purchase.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreatePurchaseSchema,
  GetPurchasesSchema,
  UpdatePurchaseSchema,
  DeletePurchaseSchema,
  AddPaymentSchema,
  UpdatePaymentSchema,
  DeletePaymentSchema,
} from './purchase.validation';

const router = express.Router();

router
  .route('/')
  .post(
    validateRequest(CreatePurchaseSchema),
    purchaseController.createPurchase
  )
  .get(
    validateRequest(GetPurchasesSchema),
    purchaseController.getPurchases
  )
  .all(methodNotAllowed);
router
  .route('/:id')
  .put(
    validateRequest(UpdatePurchaseSchema),
    purchaseController.updatePurchase
  )
  .delete(
    validateRequest(DeletePurchaseSchema),
    purchaseController.deletePurchase
  )
  .all(methodNotAllowed);
router
  .route('/:id/payments')
  .post(
    validateRequest(AddPaymentSchema),
    purchaseController.addPayment
  )
  .all(methodNotAllowed);
router
  .route('/payments/:id')
  .put(
    validateRequest(UpdatePaymentSchema),
    purchaseController.updatePayment
  )
  .delete(
    validateRequest(DeletePaymentSchema),
    purchaseController.deletePayment
  )
  .all(methodNotAllowed);

export = router;
