const express = require('express');
const promotionController = require('./promotion.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/promotions').post(asyncHandler(promotionController.createPromotion)).get(asyncHandler(promotionController.getAllPromotions)).all(methodNotAllowed);
router.route('/promotions/:id').put(asyncHandler(promotionController.updatePromotion)).delete(asyncHandler(promotionController.deletePromotion)).all(methodNotAllowed);
router.route('/promotions/product-options/:productId').get(asyncHandler(promotionController.getProductPricingOptions)).all(methodNotAllowed);
router.route('/promotions/effective-price/:productId').get(asyncHandler(promotionController.getEffectivePromoPrice)).all(methodNotAllowed);

module.exports = router;
