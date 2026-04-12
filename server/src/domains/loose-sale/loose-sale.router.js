const express = require('express');
const looseSaleController = require('./loose-sale.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  looseSaleIdParamSchema,
  createLooseSaleBodySchema,
  looseSalesReportQuerySchema,
} = require('./loose-sale.validation');

const router = express.Router();

router
  .route('/loose-sales')
  .post(
    validateRequest({ body: createLooseSaleBodySchema }),
    asyncHandler(looseSaleController.createLooseSale)
  )
  .all(methodNotAllowed);
router
  .route('/reports/loose-sales')
  .get(
    validateRequest({ query: looseSalesReportQuerySchema }),
    asyncHandler(looseSaleController.getLooseSalesReport)
  )
  .all(methodNotAllowed);
router
  .route('/loose-sales/:id')
  .delete(
    validateRequest({ params: looseSaleIdParamSchema }),
    asyncHandler(looseSaleController.deleteLooseSale)
  )
  .all(methodNotAllowed);

module.exports = router;
