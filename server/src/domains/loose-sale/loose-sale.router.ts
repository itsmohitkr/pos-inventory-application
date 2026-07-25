import express = require('express');
import looseSaleController = require('./loose-sale.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  looseSaleIdParamSchema,
  createLooseSaleBodySchema,
  looseSalesReportQuerySchema,
} from './loose-sale.validation';

const router = express.Router();

router
  .route('/loose-sales')
  .post(
    validateRequest({ body: createLooseSaleBodySchema }),
    looseSaleController.createLooseSale
  )
  .all(methodNotAllowed);
router
  .route('/reports/loose-sales')
  .get(
    validateRequest({ query: looseSalesReportQuerySchema }),
    looseSaleController.getLooseSalesReport
  )
  .all(methodNotAllowed);
router
  .route('/loose-sales/:id')
  .delete(
    validateRequest({ params: looseSaleIdParamSchema }),
    looseSaleController.deleteLooseSale
  )
  .all(methodNotAllowed);

export = router;
