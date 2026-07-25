import express = require('express');
import expenseController = require('./expense.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  expenseIdParamSchema,
  expenseQuerySchema,
  expenseBodySchema,
  expenseUpdateBodySchema,
  paymentBodySchema,
} from './expense.validation';

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

export = router;
