const promotionService = require('../services/promotion.service');

const createPromotion = async (req, res) => {
    try {
        const promotion = await promotionService.createPromotion(req.body);
        res.status(201).json(promotion);
    } catch (error) {
        console.error("Error creating promotion:", error);
        res.status(400).json({ error: error.message });
    }
};

const getAllPromotions = async (req, res) => {
    try {
        const promotions = await promotionService.getAllPromotions();
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductPricingOptions = async (req, res) => {
    try {
        const options = await promotionService.getProductPricingOptions(req.params.productId);
        if (!options) return res.status(404).json({ error: 'Product not found' });
        res.json(options);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePromotion = async (req, res) => {
    try {
        await promotionService.deletePromotion(req.params.id);
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePromotion = async (req, res) => {
    try {
        const promotion = await promotionService.updatePromotion(req.params.id, req.body);
        res.json(promotion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getEffectivePromoPrice = async (req, res) => {
    try {
        const price = await promotionService.getEffectivePromoPrice(req.params.productId);
        res.json({ promoPrice: price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPromotion,
    getAllPromotions,
    getProductPricingOptions,
    deletePromotion,
    updatePromotion,
    getEffectivePromoPrice
};
