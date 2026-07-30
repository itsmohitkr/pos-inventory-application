import { StatusCodes } from 'http-status-codes';
import type {
  CreateExpenseInput,
  ExpensePaymentInput,
  UpdateExpenseInput,
} from './expense.validation';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';

// Helper to append current time to a date string (YYYY-MM-DD)
const getDateWithCurrentTime = (dateString?: string | Date | null): Date => {
  if (!dateString) return new Date();
  const dateObj = new Date(dateString);
  const now = new Date();
  dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return dateObj;
};

const createExpense = async (data: CreateExpenseInput) => {
  const { amount, category, description, date, paidAmount, paymentMethod } = data;

  // Both are already numbers — the schema coerces them — so the previous
  // parseFloat() calls were re-parsing existing numbers.
  const parsedAmount = amount || 0;
  const parsedPaidAmount = paidAmount || 0;

  // Derived status
  let initialPaymentStatus = 'Paid';
  if (parsedPaidAmount < parsedAmount && parsedPaidAmount > 0) initialPaymentStatus = 'Due';
  if (parsedPaidAmount === 0 && parsedAmount > 0) initialPaymentStatus = 'Unpaid';

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const expense = await tx.expense.create({
      data: {
        amount: parsedAmount,
        category,
        description,
        date: date ? getDateWithCurrentTime(date) : new Date(),
        paymentStatus: initialPaymentStatus,
        paymentMethod: paymentMethod || 'Cash',
      },
    });

    // Record the initial payment if an amount was given
    if (parsedPaidAmount > 0) {
      await tx.expensePayment.create({
        data: {
          expenseId: expense.id,
          amount: parsedPaidAmount,
          paymentMethod: paymentMethod || 'Cash',
          date: expense.date,
          note: 'Initial payment',
        },
      });
    }

    return expense;
  });
};

/** Query filters accepted by getExpenses; all optional. */
interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
}

const getExpenses = async (filters: ExpenseFilters = {}) => {
  const { startDate, endDate, category } = filters;

  const where: Prisma.ExpenseWhereInput = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (category && category !== 'All') {
    where.category = category;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { payments: { orderBy: { date: 'asc' } } },
    orderBy: { date: 'desc' },
  });

  // Compute due amount and correct status dynamically based on payments
  return expenses.map((e) => {
    const totalPaid = e.payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, e.amount - totalPaid);
    let currentStatus = e.paymentStatus;
    if (dueAmount <= 0) currentStatus = 'Paid';
    else if (totalPaid > 0 && dueAmount > 0) currentStatus = 'Due';
    else if (totalPaid === 0) currentStatus = 'Unpaid';

    return { ...e, totalPaid, dueAmount, paymentStatus: currentStatus };
  });
};

const deleteExpense = async (id: number) => {
  return await prisma.expense.delete({
    where: { id },
  });
};

const updateExpense = async (id: number, data: UpdateExpenseInput) => {
  const { amount, category, description, date, paymentStatus, paymentMethod } = data;
  return await prisma.expense.update({
    where: { id },
    data: {
      amount,
      category,
      description,
      date: date ? new Date(date) : undefined,
      paymentStatus,
      paymentMethod,
    },
  });
};

// Internal helper to sync expense status after payment changes
const syncExpenseStatus = async (expenseId: number, tx?: Prisma.TransactionClient) => {
  const expense = await (tx || prisma).expense.findUnique({
    where: { id: expenseId },
    include: { payments: true },
  });

  // The expense a payment belongs to was already validated by the caller in
  // the same transaction; a missing row here means it was deleted mid-flight.
  if (!expense) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Expense not found', {
      error: 'Expense not found',
    });
  }

  const totalPaid = expense.payments.reduce((sum, p) => sum + p.amount, 0);
  let newStatus = 'Unpaid';
  if (totalPaid >= expense.amount) {
    newStatus = 'Paid';
  } else if (totalPaid > 0) {
    newStatus = 'Due';
  }

  await (tx || prisma).expense.update({
    where: { id: expense.id },
    data: { paymentStatus: newStatus },
  });
};

const addPayment = async (expenseId: number, paymentData: ExpensePaymentInput) => {
  const { amount, date, note, paymentMethod } = paymentData;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.expensePayment.create({
      data: {
        expenseId,
        amount: amount || 0,
        paymentMethod: paymentMethod || 'Cash',
        date: date ? getDateWithCurrentTime(date) : new Date(),
        note,
      },
    });

    await syncExpenseStatus(expenseId, tx);
    return payment;
  });
};

const updatePayment = async (paymentId: number, paymentData: ExpensePaymentInput) => {
  const { amount, date, note, paymentMethod } = paymentData;
  const pid = paymentId;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.expensePayment.update({
      where: { id: pid },
      data: {
        amount,
        paymentMethod,
        date: date ? getDateWithCurrentTime(date) : undefined,
        note,
      },
    });

    await syncExpenseStatus(payment.expenseId, tx);
    return payment;
  });
};

const deletePayment = async (paymentId: number) => {
  const pid = paymentId;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.expensePayment.findUnique({
      where: { id: pid },
    });

    if (!payment) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Payment not found', {
      error: 'Payment not found',
    });
  }

    await tx.expensePayment.delete({
      where: { id: pid },
    });

    await syncExpenseStatus(payment.expenseId, tx);
    return { success: true };
  });
};

export {
  createExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  addPayment,
  updatePayment,
  deletePayment,
};
