const express = require('express');
const promotionController = require('./promotion.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  promotionIdParamSchema,
  productIdParamSchema,
  promotionBodySchema,
} = require('./promotion.validation');

const router = express.Router();

router
  .route('/promotions')
  .post(
    validateRequest({ body: promotionBodySchema }),
    asyncHandler(promotionController.createPromotion)
  )
  .get(asyncHandler(promotionController.getAllPromotions))
  .all(methodNotAllowed);
router
  .route('/promotions/:id')
  .put(
    validateRequest({ params: promotionIdParamSchema, body: promotionBodySchema }),
    asyncHandler(promotionController.updatePromotion)
  )
  .delete(
    validateRequest({ params: promotionIdParamSchema }),
    asyncHandler(promotionController.deletePromotion)
  )
  .all(methodNotAllowed);
router
  .route('/promotions/product-options/:productId')
  .get(
    validateRequest({ params: productIdParamSchema }),
    asyncHandler(promotionController.getProductPricingOptions)
  )
  .all(methodNotAllowed);
router
  .route('/promotions/effective-price/:productId')
  .get(
    validateRequest({ params: productIdParamSchema }),
    asyncHandler(promotionController.getEffectivePromoPrice)
  )
  .all(methodNotAllowed);

module.exports = router;
