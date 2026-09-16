// IPC handlers for the vendor domain — replaces vendor.router.ts /
// vendor.controller.ts for packaged builds / electron-dev. See
// customer.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type VendorServiceModule = typeof import('../../server/dist/src/domains/vendor/vendor.service');
type VendorValidationModule = typeof import('../../server/dist/src/domains/vendor/vendor.validation');

const vendorService: VendorServiceModule = require(
  resolveServerModulePath('src', 'domains', 'vendor', 'vendor.service')
);
const {
  FindOrCreateVendorSchema,
  GetAllVendorsSchema,
  GetVendorByIdSchema,
  UpdateVendorSchema,
}: VendorValidationModule = require(
  resolveServerModulePath('src', 'domains', 'vendor', 'vendor.validation')
);

export const registerVendorIpc = (): void => {
  ipcMain.handle(IPC.VENDOR_FIND_OR_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(FindOrCreateVendorSchema, { body: payload });
      const result = await vendorService.findOrCreateVendor(
        body as Parameters<typeof vendorService.findOrCreateVendor>[0]
      );
      return buildSuccessPayload(
        result.isNew ? StatusCodes.CREATED : StatusCodes.OK,
        result,
        result.isNew ? 'Vendor created' : 'Vendor found',
        { format: 'raw' }
      );
    })
  );

  ipcMain.handle(IPC.VENDOR_GET_ALL, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetAllVendorsSchema, { query: payload ?? {} });
      const parsed = query as { page?: string; limit?: string; search?: string };
      const data = await vendorService.getAllVendors({
        page: parsed.page ? Number(parsed.page) : undefined,
        limit: parsed.limit ? Number(parsed.limit) : undefined,
        search: parsed.search,
      });
      return buildSuccessPayload(StatusCodes.OK, data, 'Vendors fetched', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.VENDOR_GET_BY_ID, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetVendorByIdSchema, { params: { id: payload?.id } });
      const data = await vendorService.getVendorById((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, data, 'Vendor fetched', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.VENDOR_UPDATE, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdateVendorSchema, { params: { id }, body });
      const data = await vendorService.updateVendor(
        (validated.params as { id: number }).id,
        validated.body as Parameters<typeof vendorService.updateVendor>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Vendor updated', { format: 'raw' });
    })
  );
};
