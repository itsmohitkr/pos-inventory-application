import express = require('express');
import looseSaleController = require('./loose-sale.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreateLooseSaleSchema,
  GetLooseSalesReportSchema,
  DeleteLooseSaleSchema,
} from './loose-sale.validation';

const router = express.Router();

router
  .route('/loose-sales')
  .post(
    validateRequest(CreateLooseSaleSchema),
    looseSaleController.createLooseSale
  )
  .all(methodNotAllowed);
router
  .route('/reports/loose-sales')
  .get(
    validateRequest(GetLooseSalesReportSchema),
    looseSaleController.getLooseSalesReport
  )
  .all(methodNotAllowed);
router
  .route('/loose-sales/:id')
  .delete(
    validateRequest(DeleteLooseSaleSchema),
    looseSaleController.deleteLooseSale
  )
  .all(methodNotAllowed);

export = router;
