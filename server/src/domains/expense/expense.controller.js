const { StatusCodes } = require('http-status-codes');
const expenseService = require('./expense.service');
const asyncHandler = require('../../shared/error/asyncHandler');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const createExpense = async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, expense, 'Expense created successfully', {
    format: 'raw',
  });
};

const getExpenses = async (req, res) => {
  const expenses = await expenseService.getExpenses(req.query);
  return sendSuccessResponse(res, StatusCodes.OK, expenses, 'Expenses fetched successfully', {
    format: 'raw',
  });
};

const deleteExpense = async (req, res) => {
  await expenseService.deleteExpense(req.params.id);
  return sendSuccessResponse(res, StatusCodes.NO_CONTENT);
};

const updateExpense = async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, expense, 'Expense updated successfully', {
    format: 'raw',
  });
};

const addPayment = async (req, res) => {
  const payment = await expenseService.addPayment(req.params.id, req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    payment,
    'Expense payment added successfully',
    {
      format: 'raw',
    }
  );
};

const updatePayment = async (req, res) => {
  const payment = await expenseService.updatePayment(req.params.id, req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    payment,
    'Expense payment updated successfully',
    {
      format: 'raw',
    }
  );
};

const deletePayment = async (req, res) => {
  await expenseService.deletePayment(req.params.id);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { message: 'Payment deleted successfully' },
    'Payment deleted successfully',
    {
      format: 'raw',
    }
  );
};
module.exports = {
  createExpense: asyncHandler(createExpense),
  getExpenses: asyncHandler(getExpenses),
  deleteExpense: asyncHandler(deleteExpense),
  updateExpense: asyncHandler(updateExpense),
  addPayment: asyncHandler(addPayment),
  updatePayment: asyncHandler(updatePayment),
  deletePayment: asyncHandler(deletePayment),
};
