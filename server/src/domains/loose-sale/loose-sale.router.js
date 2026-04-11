const express = require('express');
const looseSaleController = require('./loose-sale.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/loose-sales').post(asyncHandler(looseSaleController.createLooseSale)).all(methodNotAllowed);
router.route('/reports/loose-sales').get(asyncHandler(looseSaleController.getLooseSalesReport)).all(methodNotAllowed);
router.route('/loose-sales/:id').delete(asyncHandler(looseSaleController.deleteLooseSale)).all(methodNotAllowed);

module.exports = router;
