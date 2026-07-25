const express = require('express');
const customerController = require('./customer.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  customerIdParamSchema,
  barcodeParamSchema,
  phoneParamSchema,
  findOrCreateBodySchema,
  updateCustomerBodySchema,
} = require('./customer.validation');

const router = express.Router();

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(
    validateRequest({ body: findOrCreateBodySchema }),
    customerController.findOrCreate
  )
  .all(methodNotAllowed);

router
  .route('/barcode/:barcode')
  .get(
    validateRequest({ params: barcodeParamSchema }),
    customerController.getByBarcode
  )
  .all(methodNotAllowed);

router
  .route('/phone/:phone')
  .get(
    validateRequest({ params: phoneParamSchema }),
    customerController.getByPhone
  )
  .all(methodNotAllowed);

router
  .route('/:id')
  .get(
    validateRequest({ params: customerIdParamSchema }),
    customerController.getCustomerById
  )
  .put(
    validateRequest({ params: customerIdParamSchema, body: updateCustomerBodySchema }),
    customerController.updateCustomer
  )
  .all(methodNotAllowed);

router
  .route('/:id/history')
  .get(
    validateRequest({ params: customerIdParamSchema }),
    customerController.getPurchaseHistory
  )
  .all(methodNotAllowed);

module.exports = router;
