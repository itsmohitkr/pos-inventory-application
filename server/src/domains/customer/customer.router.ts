import express = require('express');
import customerController = require('./customer.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  FindOrCreateSchema,
  GetByBarcodeSchema,
  GetByPhoneSchema,
  GetCustomerByIdSchema,
  UpdateCustomerSchema,
  GetPurchaseHistorySchema,
} from './customer.validation';

const router = express.Router();

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(
    validateRequest(FindOrCreateSchema),
    customerController.findOrCreate
  )
  .all(methodNotAllowed);

router
  .route('/barcode/:barcode')
  .get(
    validateRequest(GetByBarcodeSchema),
    customerController.getByBarcode
  )
  .all(methodNotAllowed);

router
  .route('/phone/:phone')
  .get(
    validateRequest(GetByPhoneSchema),
    customerController.getByPhone
  )
  .all(methodNotAllowed);

router
  .route('/:id')
  .get(
    validateRequest(GetCustomerByIdSchema),
    customerController.getCustomerById
  )
  .put(
    validateRequest(UpdateCustomerSchema),
    customerController.updateCustomer
  )
  .all(methodNotAllowed);

router
  .route('/:id/history')
  .get(
    validateRequest(GetPurchaseHistorySchema),
    customerController.getPurchaseHistory
  )
  .all(methodNotAllowed);

export = router;
