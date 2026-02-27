const reportService = require('../services/report.service');

const getReports = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const stats = await reportService.getReports({ startDate, endDate });
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getExpiryReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const expiringBatches = await reportService.getExpiryReport({ startDate, endDate });
        res.json(expiringBatches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLowStockReport = async (req, res) => {
    try {
        const lowStockProducts = await reportService.getLowStockReport();
        res.json(lowStockProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMonthlySales = async (req, res) => {
    const { year } = req.query;
    try {
        const stats = await reportService.getMonthlySales({ year: year ? parseInt(year) : new Date().getFullYear() });
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getReports,
    getExpiryReport,
    getLowStockReport,
    getMonthlySales
};
