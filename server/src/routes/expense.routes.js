const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Payment endpoints
router.post('/:id/payments', expenseController.addPayment);
router.put('/payments/:id', expenseController.updatePayment);
router.delete('/payments/:id', expenseController.deletePayment);

module.exports = router;
