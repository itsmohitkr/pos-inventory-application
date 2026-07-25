import express = require('express');
import promotionController = require('./promotion.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  promotionIdParamSchema,
  productIdParamSchema,
  promotionBodySchema,
} from './promotion.validation';

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

export = router;
