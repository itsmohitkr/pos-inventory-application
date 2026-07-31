import express = require('express');
import reportController = require('./report.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  GetReportsSchema,
  GetExpiryReportSchema,
  GetMonthlySalesSchema,
  GetDailySalesSchema,
} from './report.validation';

const router = express.Router();

router
  .route('/reports')
  .get(validateRequest(GetReportsSchema), reportController.getReports)
  .all(methodNotAllowed);
router
  .route('/reports/expiry')
  .get(validateRequest(GetExpiryReportSchema), reportController.getExpiryReport)
  .all(methodNotAllowed);
router
  .route('/reports/low-stock')
  .get(reportController.getLowStockReport)
  .all(methodNotAllowed);
router
  .route('/reports/monthly')
  .get(validateRequest(GetMonthlySalesSchema), reportController.getMonthlySales)
  .all(methodNotAllowed);
router
  .route('/reports/daily')
  .get(validateRequest(GetDailySalesSchema), reportController.getDailySales)
  .all(methodNotAllowed);
router
  .route('/reports/top-selling')
  .get(reportController.getTopSellingProducts)
  .all(methodNotAllowed);

export = router;
