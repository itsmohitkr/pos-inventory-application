const saleService = require('../services/sale.service');

const processSale = async (req, res) => {
    try {
        const sale = await saleService.processSale(req.body);
        res.json({ message: "Sale processed successfully", saleId: sale.id, sale });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const sale = await saleService.getSaleById(id);
        if (!sale) return res.status(404).json({ error: "Sale not found" });
        res.json(sale);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const processReturn = async (req, res) => {
    const { id: saleId } = req.params;
    const { items } = req.body;
    try {
        const result = await saleService.processReturn(saleId, items);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    processSale,
    getSaleById,
    processReturn
};
