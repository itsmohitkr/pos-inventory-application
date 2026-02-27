const purchaseService = require('../services/purchase.service');

const createPurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.createPurchase(req.body);
        res.status(201).json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPurchases = async (req, res) => {
    try {
        const purchases = await purchaseService.getPurchases(req.query);
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePurchase = async (req, res) => {
    try {
        await purchaseService.deletePurchase(req.params.id);
        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.updatePurchase(req.params.id, req.body);
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPurchase,
    getPurchases,
    deletePurchase,
    updatePurchase
};
