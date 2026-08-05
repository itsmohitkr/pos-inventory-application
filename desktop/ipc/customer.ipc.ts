// IPC handlers for the customer domain — replaces customer.router.ts /
// customer.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type CustomerServiceModule = typeof import('../../server/dist/src/domains/customer/customer.service');
type CustomerValidationModule = typeof import('../../server/dist/src/domains/customer/customer.validation');

const customerService: CustomerServiceModule = require(
  resolveServerModulePath('src', 'domains', 'customer', 'customer.service')
);
const {
  FindOrCreateSchema,
  GetByBarcodeSchema,
  GetByPhoneSchema,
  GetCustomerByIdSchema,
  UpdateCustomerSchema,
  GetPurchaseHistorySchema,
}: CustomerValidationModule = require(
  resolveServerModulePath('src', 'domains', 'customer', 'customer.validation')
);

export const registerCustomerIpc = (): void => {
  ipcMain.handle(IPC.CUSTOMER_FIND_OR_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(FindOrCreateSchema, { body: payload });
      const result = await customerService.findOrCreateCustomer(
        body as Parameters<typeof customerService.findOrCreateCustomer>[0]
      );
      return buildSuccessPayload(
        result.isNew ? StatusCodes.CREATED : StatusCodes.OK,
        result,
        result.isNew ? 'Customer created' : 'Customer found',
        { format: 'raw' }
      );
    })
  );

  // No validation schema on the HTTP route (GET / has no validateRequest
  // wrapper), and the IPC payload already carries real numbers rather than
  // HTTP query strings, so it is forwarded straight to the service, which
  // has the same defaults (page 1 / limit 50 / search '' / sortBy createdAt
  // / order desc) the controller's queryCount/queryStrOr fell back to.
  ipcMain.handle(IPC.CUSTOMER_GET_ALL, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const data = await customerService.getAllCustomers(
        (payload ?? {}) as Parameters<typeof customerService.getAllCustomers>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Customers fetched', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.CUSTOMER_GET_BY_ID, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetCustomerByIdSchema, { params: { id: payload?.id } });
      const data = await customerService.getCustomerById((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, data, 'Customer fetched', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.CUSTOMER_UPDATE, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdateCustomerSchema, { params: { id }, body });
      const data = await customerService.updateCustomer(
        (validated.params as { id: number }).id,
        validated.body as Parameters<typeof customerService.updateCustomer>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Customer updated', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.CUSTOMER_GET_BY_BARCODE, async (_event, payload: { barcode?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetByBarcodeSchema, { params: { barcode: payload?.barcode } });
      const data = await customerService.findByBarcode((params as { barcode: string }).barcode);
      return buildSuccessPayload(StatusCodes.OK, data, 'Customer found', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.CUSTOMER_GET_BY_PHONE, async (_event, payload: { phone?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetByPhoneSchema, { params: { phone: payload?.phone } });
      const data = await customerService.findByPhone((params as { phone: string }).phone);
      return buildSuccessPayload(StatusCodes.OK, data, 'Customer found', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.CUSTOMER_GET_PURCHASE_HISTORY, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetPurchaseHistorySchema, { params: { id: payload?.id } });
      const data = await customerService.getCustomerPurchaseHistory((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, data, 'Purchase history fetched', { format: 'raw' });
    })
  );
};
