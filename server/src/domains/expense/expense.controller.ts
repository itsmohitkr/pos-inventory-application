import type { Request, Response } from 'express';
import { paramInt } from '../../shared/utils/requestParams';
import { StatusCodes } from 'http-status-codes';
import expenseService = require('./expense.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const createExpense = async (req: Request, res: Response) => {
  const expense = await expenseService.createExpense(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, expense, 'Expense created successfully', {
    format: 'raw',
  });
};

const getExpenses = async (req: Request, res: Response) => {
  const expenses = await expenseService.getExpenses(req.query);
  return sendSuccessResponse(res, StatusCodes.OK, expenses, 'Expenses fetched successfully', {
    format: 'raw',
  });
};

const deleteExpense = async (req: Request, res: Response) => {
  await expenseService.deleteExpense(paramInt(req.params.id));
  return sendSuccessResponse(res, StatusCodes.NO_CONTENT);
};

const updateExpense = async (req: Request, res: Response) => {
  const expense = await expenseService.updateExpense(paramInt(req.params.id), req.body);
  return sendSuccessResponse(res, StatusCodes.OK, expense, 'Expense updated successfully', {
    format: 'raw',
  });
};

const addPayment = async (req: Request, res: Response) => {
  const payment = await expenseService.addPayment(paramInt(req.params.id), req.body);
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

const updatePayment = async (req: Request, res: Response) => {
  const payment = await expenseService.updatePayment(paramInt(req.params.id), req.body);
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

const deletePayment = async (req: Request, res: Response) => {
  await expenseService.deletePayment(paramInt(req.params.id));
  const message = 'Payment deleted successfully';
  return sendSuccessResponse(res, StatusCodes.OK, { message }, message, {
    format: 'raw',
  });
};
export = {
  createExpense: asyncHandler(createExpense),
  getExpenses: asyncHandler(getExpenses),
  deleteExpense: asyncHandler(deleteExpense),
  updateExpense: asyncHandler(updateExpense),
  addPayment: asyncHandler(addPayment),
  updatePayment: asyncHandler(updatePayment),
  deletePayment: asyncHandler(deletePayment),
};
