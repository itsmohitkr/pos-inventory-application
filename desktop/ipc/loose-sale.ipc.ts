// IPC handlers for the loose-sale domain — replaces loose-sale.router.ts /
// loose-sale.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type LooseSaleServiceModule = typeof import('../../server/dist/src/domains/loose-sale/loose-sale.service');
type LooseSaleValidationModule = typeof import('../../server/dist/src/domains/loose-sale/loose-sale.validation');

const looseSaleService: LooseSaleServiceModule = require(
  resolveServerModulePath('src', 'domains', 'loose-sale', 'loose-sale.service')
);
const {
  CreateLooseSaleSchema,
  GetLooseSalesReportSchema,
  DeleteLooseSaleSchema,
}: LooseSaleValidationModule = require(
  resolveServerModulePath('src', 'domains', 'loose-sale', 'loose-sale.validation')
);

export const registerLooseSaleIpc = (): void => {
  ipcMain.handle(IPC.LOOSE_SALE_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreateLooseSaleSchema, { body: payload });
      const parsed = body as { itemName?: string | null; price: number };
      const looseSale = await looseSaleService.createLooseSale({
        itemName: parsed.itemName,
        price: parsed.price,
      });
      return buildSuccessPayload(StatusCodes.CREATED, looseSale, 'Loose sale created successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.LOOSE_SALE_GET_REPORT, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetLooseSalesReportSchema, { query: payload });
      const data = await looseSaleService.getLooseSalesReport(
        query as Parameters<typeof looseSaleService.getLooseSalesReport>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, data, 'Loose sales fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.LOOSE_SALE_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteLooseSaleSchema, {
        params: { id: payload?.id },
      });
      await looseSaleService.deleteLooseSale((params as { id: number }).id);
      const message = 'Loose sale deleted successfully';
      return buildSuccessPayload(StatusCodes.OK, { message }, message, { format: 'raw' });
    })
  );
};
