// IPC handlers for the purchase domain — replaces purchase.router.ts /
// purchase.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type PurchaseServiceModule = typeof import('../../server/dist/src/domains/purchase/purchase.service');
type PurchaseValidationModule = typeof import('../../server/dist/src/domains/purchase/purchase.validation');

const purchaseService: PurchaseServiceModule = require(
  resolveServerModulePath('src', 'domains', 'purchase', 'purchase.service')
);
const {
  CreatePurchaseSchema,
  GetPurchasesSchema,
  UpdatePurchaseSchema,
  DeletePurchaseSchema,
  AddPaymentSchema,
  UpdatePaymentSchema,
  DeletePaymentSchema,
}: PurchaseValidationModule = require(
  resolveServerModulePath('src', 'domains', 'purchase', 'purchase.validation')
);

export const registerPurchaseIpc = (): void => {
  ipcMain.handle(IPC.PURCHASE_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreatePurchaseSchema, { body: payload });
      const data = await purchaseService.createPurchase(
        body as Parameters<typeof purchaseService.createPurchase>[0]
      );
      return buildSuccessPayload(StatusCodes.CREATED, data, 'Purchase created successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.PURCHASE_GET_ALL, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetPurchasesSchema, { query: payload });
      const data = await purchaseService.getPurchases(
        query as Parameters<typeof purchaseService.getPurchases>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Purchases fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.PURCHASE_UPDATE, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdatePurchaseSchema, { params: { id }, body });
      const data = await purchaseService.updatePurchase(
        (validated.params as { id: number }).id,
        validated.body as Parameters<typeof purchaseService.updatePurchase>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Purchase updated successfully', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.PURCHASE_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeletePurchaseSchema, { params: { id: payload?.id } });
      await purchaseService.deletePurchase((params as { id: number }).id);
      const message = 'Purchase deleted successfully';
      return buildSuccessPayload(StatusCodes.OK, { message }, message, { format: 'raw' });
    })
  );

  ipcMain.handle(
    IPC.PURCHASE_ADD_PAYMENT,
    async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
      withErrorHandling(async () => {
        const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
        const validated = validateIpcPayload(AddPaymentSchema, { params: { id }, body });
        const data = await purchaseService.addPayment(
          (validated.params as { id: number }).id,
          validated.body as Parameters<typeof purchaseService.addPayment>[1]
        );
        return buildSuccessPayload(StatusCodes.CREATED, data, 'Purchase payment added successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(
    IPC.PURCHASE_UPDATE_PAYMENT,
    async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
      withErrorHandling(async () => {
        const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
        const validated = validateIpcPayload(UpdatePaymentSchema, { params: { id }, body });
        const data = await purchaseService.updatePayment(
          (validated.params as { id: number }).id,
          validated.body as Parameters<typeof purchaseService.updatePayment>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, data, 'Purchase payment updated successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(IPC.PURCHASE_DELETE_PAYMENT, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeletePaymentSchema, { params: { id: payload?.id } });
      await purchaseService.deletePayment((params as { id: number }).id);
      const message = 'Payment deleted successfully';
      return buildSuccessPayload(StatusCodes.OK, { message }, message, { format: 'raw' });
    })
  );
};
