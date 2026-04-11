const express = require('express');
const purchaseController = require('./purchase.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
    purchaseIdParamSchema,
    purchaseQuerySchema,
    purchaseBodySchema,
    purchaseUpdateBodySchema,
    paymentBodySchema
} = require('./purchase.validation');

const router = express.Router();

router.route('/').post(validateRequest({ body: purchaseBodySchema }), asyncHandler(purchaseController.createPurchase)).get(validateRequest({ query: purchaseQuerySchema }), asyncHandler(purchaseController.getPurchases)).all(methodNotAllowed);
router.route('/:id').put(validateRequest({ params: purchaseIdParamSchema, body: purchaseUpdateBodySchema }), asyncHandler(purchaseController.updatePurchase)).delete(validateRequest({ params: purchaseIdParamSchema }), asyncHandler(purchaseController.deletePurchase)).all(methodNotAllowed);
router.route('/:id/payments').post(validateRequest({ params: purchaseIdParamSchema, body: paymentBodySchema }), asyncHandler(purchaseController.addPayment)).all(methodNotAllowed);
router.route('/payments/:id').put(validateRequest({ params: purchaseIdParamSchema, body: paymentBodySchema }), asyncHandler(purchaseController.updatePayment)).delete(validateRequest({ params: purchaseIdParamSchema }), asyncHandler(purchaseController.deletePayment)).all(methodNotAllowed);

module.exports = router;
