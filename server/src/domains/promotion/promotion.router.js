const express = require('express');
const promotionController = require('./promotion.controller');
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
    promotionController.createPromotion
  )
  .get(promotionController.getAllPromotions)
  .all(methodNotAllowed);
router
  .route('/promotions/:id')
  .put(
    validateRequest({ params: promotionIdParamSchema, body: promotionBodySchema }),
    promotionController.updatePromotion
  )
  .delete(
    validateRequest({ params: promotionIdParamSchema }),
    promotionController.deletePromotion
  )
  .all(methodNotAllowed);
router
  .route('/promotions/product-options/:productId')
  .get(
    validateRequest({ params: productIdParamSchema }),
    promotionController.getProductPricingOptions
  )
  .all(methodNotAllowed);
router
  .route('/promotions/effective-price/:productId')
  .get(
    validateRequest({ params: productIdParamSchema }),
    promotionController.getEffectivePromoPrice
  )
  .all(methodNotAllowed);

module.exports = router;
