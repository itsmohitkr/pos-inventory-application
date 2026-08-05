// IPC handlers for the expense domain — replaces expense.router.ts /
// expense.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type ExpenseServiceModule = typeof import('../../server/dist/src/domains/expense/expense.service');
type ExpenseValidationModule = typeof import('../../server/dist/src/domains/expense/expense.validation');

const expenseService: ExpenseServiceModule = require(
  resolveServerModulePath('src', 'domains', 'expense', 'expense.service')
);
const {
  CreateExpenseSchema,
  GetExpensesSchema,
  UpdateExpenseSchema,
  DeleteExpenseSchema,
  AddPaymentSchema,
  UpdatePaymentSchema,
  DeletePaymentSchema,
}: ExpenseValidationModule = require(
  resolveServerModulePath('src', 'domains', 'expense', 'expense.validation')
);

export const registerExpenseIpc = (): void => {
  ipcMain.handle(IPC.EXPENSE_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreateExpenseSchema, { body: payload });
      const data = await expenseService.createExpense(
        body as Parameters<typeof expenseService.createExpense>[0]
      );
      return buildSuccessPayload(StatusCodes.CREATED, data, 'Expense created successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.EXPENSE_GET_ALL, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetExpensesSchema, { query: payload });
      const data = await expenseService.getExpenses(
        query as Parameters<typeof expenseService.getExpenses>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Expenses fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.EXPENSE_UPDATE, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdateExpenseSchema, { params: { id }, body });
      const data = await expenseService.updateExpense(
        (validated.params as { id: number }).id,
        validated.body as Parameters<typeof expenseService.updateExpense>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Expense updated successfully', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.EXPENSE_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteExpenseSchema, { params: { id: payload?.id } });
      await expenseService.deleteExpense((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.NO_CONTENT);
    })
  );

  ipcMain.handle(
    IPC.EXPENSE_ADD_PAYMENT,
    async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
      withErrorHandling(async () => {
        const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
        const validated = validateIpcPayload(AddPaymentSchema, { params: { id }, body });
        const data = await expenseService.addPayment(
          (validated.params as { id: number }).id,
          validated.body as Parameters<typeof expenseService.addPayment>[1]
        );
        return buildSuccessPayload(StatusCodes.CREATED, data, 'Expense payment added successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(
    IPC.EXPENSE_UPDATE_PAYMENT,
    async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
      withErrorHandling(async () => {
        const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
        const validated = validateIpcPayload(UpdatePaymentSchema, { params: { id }, body });
        const data = await expenseService.updatePayment(
          (validated.params as { id: number }).id,
          validated.body as Parameters<typeof expenseService.updatePayment>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, data, 'Expense payment updated successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(IPC.EXPENSE_DELETE_PAYMENT, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeletePaymentSchema, { params: { id: payload?.id } });
      await expenseService.deletePayment((params as { id: number }).id);
      const message = 'Payment deleted successfully';
      return buildSuccessPayload(StatusCodes.OK, { message }, message, { format: 'raw' });
    })
  );
};
