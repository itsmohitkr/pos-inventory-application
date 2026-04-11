const reportService = require('./report.service');

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

const getDailySales = async (req, res) => {
    const { year, month } = req.query;
    try {
        const parsedYear = year ? parseInt(year) : new Date().getFullYear();
        const parsedMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const stats = await reportService.getDailySales({ year: parsedYear, month: parsedMonth });
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTopSellingProducts = async (req, res) => {
    try {
        const stats = await reportService.getTopSellingProducts();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getReports,
    getExpiryReport,
    getLowStockReport,
    getMonthlySales,
    getDailySales,
    getTopSellingProducts
};
