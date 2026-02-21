const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

router.get('/reports', reportController.getReports);
router.get('/reports/expiry', reportController.getExpiryReport);
router.get('/reports/low-stock', reportController.getLowStockReport);

module.exports = router;
