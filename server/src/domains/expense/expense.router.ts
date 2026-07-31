import express = require('express');
import expenseController = require('./expense.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreateExpenseSchema,
  GetExpensesSchema,
  UpdateExpenseSchema,
  DeleteExpenseSchema,
  AddPaymentSchema,
  UpdatePaymentSchema,
  DeletePaymentSchema,
} from './expense.validation';

const router = express.Router();

router
  .route('/')
  .post(validateRequest(CreateExpenseSchema), expenseController.createExpense)
  .get(validateRequest(GetExpensesSchema), expenseController.getExpenses)
  .all(methodNotAllowed);
router
  .route('/:id')
  .put(
    validateRequest(UpdateExpenseSchema),
    expenseController.updateExpense
  )
  .delete(
    validateRequest(DeleteExpenseSchema),
    expenseController.deleteExpense
  )
  .all(methodNotAllowed);

// Payment endpoints
router
  .route('/:id/payments')
  .post(
    validateRequest(AddPaymentSchema),
    expenseController.addPayment
  )
  .all(methodNotAllowed);
router
  .route('/payments/:id')
  .put(
    validateRequest(UpdatePaymentSchema),
    expenseController.updatePayment
  )
  .delete(
    validateRequest(DeletePaymentSchema),
    expenseController.deletePayment
  )
  .all(methodNotAllowed);

export = router;
