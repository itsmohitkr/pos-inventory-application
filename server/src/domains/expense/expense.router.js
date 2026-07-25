const express = require('express');
const expenseController = require('./expense.controller');
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
  .post(validateRequest({ body: expenseBodySchema }), expenseController.createExpense)
  .get(validateRequest({ query: expenseQuerySchema }), expenseController.getExpenses)
  .all(methodNotAllowed);
router
  .route('/:id')
  .put(
    validateRequest({ params: expenseIdParamSchema, body: expenseUpdateBodySchema }),
    expenseController.updateExpense
  )
  .delete(
    validateRequest({ params: expenseIdParamSchema }),
    expenseController.deleteExpense
  )
  .all(methodNotAllowed);

// Payment endpoints
router
  .route('/:id/payments')
  .post(
    validateRequest({ params: expenseIdParamSchema, body: paymentBodySchema }),
    expenseController.addPayment
  )
  .all(methodNotAllowed);
router
  .route('/payments/:id')
  .put(
    validateRequest({ params: expenseIdParamSchema, body: paymentBodySchema }),
    expenseController.updatePayment
  )
  .delete(
    validateRequest({ params: expenseIdParamSchema }),
    expenseController.deletePayment
  )
  .all(methodNotAllowed);

module.exports = router;
