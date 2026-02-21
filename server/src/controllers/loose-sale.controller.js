const looseSaleService = require('../services/loose-sale.service');

const createLooseSale = async (req, res) => {
    try {
        const { itemName, price } = req.body;
        if (!price || isNaN(price)) {
            return res.status(400).json({ error: 'Valid price is required' });
        }
        const looseSale = await looseSaleService.createLooseSale({ itemName, price });
        res.status(201).json(looseSale);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLooseSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await looseSaleService.getLooseSalesReport({ startDate, endDate });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createLooseSale,
    getLooseSalesReport
};
