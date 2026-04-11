const express = require('express');
const reportController = require('./report.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
    dateRangeQuerySchema,
    monthlySalesQuerySchema,
    dailySalesQuerySchema
} = require('./report.validation');

const router = express.Router();

router.route('/reports').get(validateRequest({ query: dateRangeQuerySchema }), asyncHandler(reportController.getReports)).all(methodNotAllowed);
router.route('/reports/expiry').get(validateRequest({ query: dateRangeQuerySchema }), asyncHandler(reportController.getExpiryReport)).all(methodNotAllowed);
router.route('/reports/low-stock').get(asyncHandler(reportController.getLowStockReport)).all(methodNotAllowed);
router.route('/reports/monthly').get(validateRequest({ query: monthlySalesQuerySchema }), asyncHandler(reportController.getMonthlySales)).all(methodNotAllowed);
router.route('/reports/daily').get(validateRequest({ query: dailySalesQuerySchema }), asyncHandler(reportController.getDailySales)).all(methodNotAllowed);
router.route('/reports/top-selling').get(asyncHandler(reportController.getTopSellingProducts)).all(methodNotAllowed);

module.exports = router;
