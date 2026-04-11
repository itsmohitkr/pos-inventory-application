const express = require('express');
const reportController = require('./controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/reports').get(asyncHandler(reportController.getReports)).all(methodNotAllowed);
router.route('/reports/expiry').get(asyncHandler(reportController.getExpiryReport)).all(methodNotAllowed);
router.route('/reports/low-stock').get(asyncHandler(reportController.getLowStockReport)).all(methodNotAllowed);
router.route('/reports/monthly').get(asyncHandler(reportController.getMonthlySales)).all(methodNotAllowed);
router.route('/reports/daily').get(asyncHandler(reportController.getDailySales)).all(methodNotAllowed);
router.route('/reports/top-selling').get(asyncHandler(reportController.getTopSellingProducts)).all(methodNotAllowed);

module.exports = router;
