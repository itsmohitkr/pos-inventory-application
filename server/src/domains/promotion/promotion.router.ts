import express = require('express');
import promotionController = require('./promotion.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreatePromotionSchema,
  UpdatePromotionSchema,
  DeletePromotionSchema,
  GetProductPricingOptionsSchema,
  GetEffectivePromoPriceSchema,
} from './promotion.validation';

const router = express.Router();

router
  .route('/promotions')
  .post(
    validateRequest(CreatePromotionSchema),
    promotionController.createPromotion
  )
  .get(promotionController.getAllPromotions)
  .all(methodNotAllowed);
router
  .route('/promotions/:id')
  .put(
    validateRequest(UpdatePromotionSchema),
    promotionController.updatePromotion
  )
  .delete(
    validateRequest(DeletePromotionSchema),
    promotionController.deletePromotion
  )
  .all(methodNotAllowed);
router
  .route('/promotions/product-options/:productId')
  .get(
    validateRequest(GetProductPricingOptionsSchema),
    promotionController.getProductPricingOptions
  )
  .all(methodNotAllowed);
router
  .route('/promotions/effective-price/:productId')
  .get(
    validateRequest(GetEffectivePromoPriceSchema),
    promotionController.getEffectivePromoPrice
  )
  .all(methodNotAllowed);

export = router;
