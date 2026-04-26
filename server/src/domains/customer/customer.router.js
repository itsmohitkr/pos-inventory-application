const express = require('express');
const customerController = require('./customer.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
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
  .get(asyncHandler(customerController.getAllCustomers))
  .post(
    validateRequest({ body: findOrCreateBodySchema }),
    asyncHandler(customerController.findOrCreate)
  )
  .all(methodNotAllowed);

router
  .route('/barcode/:barcode')
  .get(
    validateRequest({ params: barcodeParamSchema }),
    asyncHandler(customerController.getByBarcode)
  )
  .all(methodNotAllowed);

router
  .route('/phone/:phone')
  .get(
    validateRequest({ params: phoneParamSchema }),
    asyncHandler(customerController.getByPhone)
  )
  .all(methodNotAllowed);

router
  .route('/:id')
  .get(
    validateRequest({ params: customerIdParamSchema }),
    asyncHandler(customerController.getCustomerById)
  )
  .put(
    validateRequest({ params: customerIdParamSchema, body: updateCustomerBodySchema }),
    asyncHandler(customerController.updateCustomer)
  )
  .all(methodNotAllowed);

router
  .route('/:id/history')
  .get(
    validateRequest({ params: customerIdParamSchema }),
    asyncHandler(customerController.getPurchaseHistory)
  )
  .all(methodNotAllowed);

module.exports = router;
