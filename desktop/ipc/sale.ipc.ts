// IPC handlers for the sale domain — replaces sale.router.ts /
// sale.controller.ts for packaged builds / electron-dev. See category.ipc.ts
// and the IPC migration plan for the shared pattern.
//
// Highest business-risk domain of the migration (batch/stock movement,
// POS-critical) — every handler here reuses processSale/processReturn
// unchanged; only the transport differs.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type SaleServiceModule = typeof import('../../server/dist/src/domains/sale/sale.service');
type SaleValidationModule = typeof import('../../server/dist/src/domains/sale/sale.validation');

const saleService: SaleServiceModule = require(
  resolveServerModulePath('src', 'domains', 'sale', 'sale.service')
);
const { ProcessSaleSchema, GetSaleByIdSchema, ProcessReturnSchema }: SaleValidationModule = require(
  resolveServerModulePath('src', 'domains', 'sale', 'sale.validation')
);

export const registerSaleIpc = (): void => {
  ipcMain.handle(IPC.SALE_PROCESS, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(ProcessSaleSchema, { body: payload });
      const sale = await saleService.processSale(
        body as Parameters<typeof saleService.processSale>[0]
      );
      return buildSuccessPayload(
        StatusCodes.CREATED,
        { saleId: sale.id, sale },
        'Sale processed successfully',
        { format: 'merge' }
      );
    })
  );

  ipcMain.handle(IPC.SALE_GET_BY_ID, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetSaleByIdSchema, { params: { id: payload?.id } });
      const sale = await saleService.getSaleById((params as { id: number | string }).id);
      return buildSuccessPayload(StatusCodes.OK, sale, 'Sale fetched successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.SALE_PROCESS_RETURN, async (_event, payload: { id?: unknown; items?: unknown }) =>
    withErrorHandling(async () => {
      const { params, body } = validateIpcPayload(ProcessReturnSchema, {
        params: { id: payload?.id },
        body: { items: payload?.items },
      });
      const { items } = body as { items: Parameters<typeof saleService.processReturn>[1] };
      const result = await saleService.processReturn((params as { id: number | string }).id, items);
      return buildSuccessPayload(StatusCodes.OK, result, 'Return processed successfully', {
        format: 'merge',
      });
    })
  );
};
