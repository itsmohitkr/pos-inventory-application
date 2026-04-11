const express = require('express');
const expenseController = require('./expense.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/').post(asyncHandler(expenseController.createExpense)).get(asyncHandler(expenseController.getExpenses)).all(methodNotAllowed);
router.route('/:id').put(asyncHandler(expenseController.updateExpense)).delete(asyncHandler(expenseController.deleteExpense)).all(methodNotAllowed);

// Payment endpoints
router.route('/:id/payments').post(asyncHandler(expenseController.addPayment)).all(methodNotAllowed);
router.route('/payments/:id').put(asyncHandler(expenseController.updatePayment)).delete(asyncHandler(expenseController.deletePayment)).all(methodNotAllowed);

module.exports = router;
