const express = require('express');
const reportController = require('./report.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  dateRangeQuerySchema,
  monthlySalesQuerySchema,
  dailySalesQuerySchema,
} = require('./report.validation');

const router = express.Router();

router
  .route('/reports')
  .get(validateRequest({ query: dateRangeQuerySchema }), reportController.getReports)
  .all(methodNotAllowed);
router
  .route('/reports/expiry')
  .get(validateRequest({ query: dateRangeQuerySchema }), reportController.getExpiryReport)
  .all(methodNotAllowed);
router
  .route('/reports/low-stock')
  .get(reportController.getLowStockReport)
  .all(methodNotAllowed);
router
  .route('/reports/monthly')
  .get(validateRequest({ query: monthlySalesQuerySchema }), reportController.getMonthlySales)
  .all(methodNotAllowed);
router
  .route('/reports/daily')
  .get(validateRequest({ query: dailySalesQuerySchema }), reportController.getDailySales)
  .all(methodNotAllowed);
router
  .route('/reports/top-selling')
  .get(reportController.getTopSellingProducts)
  .all(methodNotAllowed);

module.exports = router;
