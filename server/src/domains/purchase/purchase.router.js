const express = require('express');
const purchaseController = require('./purchase.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/').post(asyncHandler(purchaseController.createPurchase)).get(asyncHandler(purchaseController.getPurchases)).all(methodNotAllowed);
router.route('/:id').put(asyncHandler(purchaseController.updatePurchase)).delete(asyncHandler(purchaseController.deletePurchase)).all(methodNotAllowed);
router.route('/:id/payments').post(asyncHandler(purchaseController.addPayment)).all(methodNotAllowed);
router.route('/payments/:id').put(asyncHandler(purchaseController.updatePayment)).delete(asyncHandler(purchaseController.deletePayment)).all(methodNotAllowed);

module.exports = router;
