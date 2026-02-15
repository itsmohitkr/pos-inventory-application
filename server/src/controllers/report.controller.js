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

module.exports = {
    getReports
};
