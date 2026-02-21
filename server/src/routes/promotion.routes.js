const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');

router.post('/promotions', promotionController.createPromotion);
router.get('/promotions', promotionController.getAllPromotions);
router.put('/promotions/:id', promotionController.updatePromotion);
router.delete('/promotions/:id', promotionController.deletePromotion);
router.get('/promotions/product-options/:productId', promotionController.getProductPricingOptions);
router.get('/promotions/effective-price/:productId', promotionController.getEffectivePromoPrice);

module.exports = router;
