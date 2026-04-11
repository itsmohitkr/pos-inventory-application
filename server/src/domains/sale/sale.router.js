const express = require('express');
const saleController = require('./sale.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/sale').post(asyncHandler(saleController.processSale)).all(methodNotAllowed);
router.route('/sale/:id').get(asyncHandler(saleController.getSaleById)).all(methodNotAllowed);
router.route('/sale/:id/return').post(asyncHandler(saleController.processReturn)).all(methodNotAllowed);

module.exports = router;
