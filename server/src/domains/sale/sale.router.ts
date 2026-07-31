import express = require('express');
import saleController = require('./sale.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  ProcessSaleSchema,
  GetSaleByIdSchema,
  ProcessReturnSchema,
} from './sale.validation';

const router = express.Router();

router
  .route('/sale')
  .post(validateRequest(ProcessSaleSchema), saleController.processSale)
  .all(methodNotAllowed);
router
  .route('/sale/:id')
  .get(validateRequest(GetSaleByIdSchema), saleController.getSaleById)
  .all(methodNotAllowed);
router
  .route('/sale/:id/return')
  .post(
    validateRequest(ProcessReturnSchema),
    saleController.processReturn
  )
  .all(methodNotAllowed);

export = router;
