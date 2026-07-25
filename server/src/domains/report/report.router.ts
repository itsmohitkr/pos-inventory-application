import express = require('express');
import reportController = require('./report.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  dateRangeQuerySchema,
  monthlySalesQuerySchema,
  dailySalesQuerySchema,
} from './report.validation';

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

export = router;
