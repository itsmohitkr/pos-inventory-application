const express = require('express');
const expenseController = require('./expense.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  expenseIdParamSchema,
  expenseQuerySchema,
  expenseBodySchema,
  expenseUpdateBodySchema,
  paymentBodySchema,
} = require('./expense.validation');

const router = express.Router();

router
  .route('/')
  .post(validateRequest({ body: expenseBodySchema }), asyncHandler(expenseController.createExpense))
  .get(validateRequest({ query: expenseQuerySchema }), asyncHandler(expenseController.getExpenses))
  .all(methodNotAllowed);
router
  .route('/:id')
  .put(
    validateRequest({ params: expenseIdParamSchema, body: expenseUpdateBodySchema }),
    asyncHandler(expenseController.updateExpense)
  )
  .delete(
    validateRequest({ params: expenseIdParamSchema }),
    asyncHandler(expenseController.deleteExpense)
  )
  .all(methodNotAllowed);

// Payment endpoints
router
  .route('/:id/payments')
  .post(
    validateRequest({ params: expenseIdParamSchema, body: paymentBodySchema }),
    asyncHandler(expenseController.addPayment)
  )
  .all(methodNotAllowed);
router
  .route('/payments/:id')
  .put(
    validateRequest({ params: expenseIdParamSchema, body: paymentBodySchema }),
    asyncHandler(expenseController.updatePayment)
  )
  .delete(
    validateRequest({ params: expenseIdParamSchema }),
    asyncHandler(expenseController.deletePayment)
  )
  .all(methodNotAllowed);

module.exports = router;
