const { StatusCodes } = require('http-status-codes');
const expenseService = require('./expense.service');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const mapExpenseError = (error, defaultStatus = StatusCodes.INTERNAL_SERVER_ERROR) => {
  throw toAppError(error, {
    defaultStatus,
    notFoundMessages: [
      'Payment not found',
      'Record to delete does not exist',
      'Record to update not found',
    ],
  });
};

const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    return sendSuccessResponse(res, StatusCodes.CREATED, expense, 'Expense created successfully', {
      format: 'raw',
    });
  } catch (error) {
    return mapExpenseError(error);
  }
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getExpenses(req.query);
    return sendSuccessResponse(res, StatusCodes.OK, expenses, 'Expenses fetched successfully', {
      format: 'raw',
    });
  } catch (error) {
    return mapExpenseError(error);
  }
};

const deleteExpense = async (req, res) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    return sendSuccessResponse(res, StatusCodes.NO_CONTENT);
  } catch (error) {
    return mapExpenseError(error);
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    return sendSuccessResponse(res, StatusCodes.OK, expense, 'Expense updated successfully', {
      format: 'raw',
    });
  } catch (error) {
    return mapExpenseError(error);
  }
};

const addPayment = async (req, res) => {
  try {
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
  } catch (error) {
    return mapExpenseError(error);
  }
};

const updatePayment = async (req, res) => {
  try {
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
  } catch (error) {
    return mapExpenseError(error);
  }
};

const deletePayment = async (req, res) => {
  try {
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
  } catch (error) {
    return mapExpenseError(error);
  }
};
module.exports = {
  createExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  addPayment,
  updatePayment,
  deletePayment,
};
