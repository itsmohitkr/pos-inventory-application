import express = require('express');
import saleController = require('./sale.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  saleIdParamSchema,
  processSaleBodySchema,
  processReturnBodySchema,
} from './sale.validation';

const router = express.Router();

router
  .route('/sale')
  .post(validateRequest({ body: processSaleBodySchema }), saleController.processSale)
  .all(methodNotAllowed);
router
  .route('/sale/:id')
  .get(validateRequest({ params: saleIdParamSchema }), saleController.getSaleById)
  .all(methodNotAllowed);
router
  .route('/sale/:id/return')
  .post(
    validateRequest({ params: saleIdParamSchema, body: processReturnBodySchema }),
    saleController.processReturn
  )
  .all(methodNotAllowed);

export = router;
