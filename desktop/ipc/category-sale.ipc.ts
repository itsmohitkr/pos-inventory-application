// IPC handlers for the category-sale domain — replaces category-sale.router.ts
// / category-sale.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type CategorySaleServiceModule = typeof import('../../server/dist/src/domains/category-sale/category-sale.service');
type CategorySaleValidationModule = typeof import('../../server/dist/src/domains/category-sale/category-sale.validation');

const categorySaleService: CategorySaleServiceModule = require(
  resolveServerModulePath('src', 'domains', 'category-sale', 'category-sale.service')
);
const {
  CreateCategorySaleSchema,
  UpdateCategorySaleSchema,
  DeleteCategorySaleSchema,
  ToggleCategorySaleStatusSchema,
  PreviewCategorySaleSchema,
}: CategorySaleValidationModule = require(
  resolveServerModulePath('src', 'domains', 'category-sale', 'category-sale.validation')
);

export const registerCategorySaleIpc = (): void => {
  ipcMain.handle(IPC.CATEGORY_SALE_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreateCategorySaleSchema, { body: payload });
      const sale = await categorySaleService.createCategorySale(
        body as Parameters<typeof categorySaleService.createCategorySale>[0]
      );
      return buildSuccessPayload(StatusCodes.CREATED, sale, 'Category sale created successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.CATEGORY_SALE_GET_ALL, async () =>
    withErrorHandling(async () => {
      const sales = await categorySaleService.getAllCategorySales();
      return buildSuccessPayload(StatusCodes.OK, sales, 'Category sales fetched successfully', {
        format: 'raw',
      });
    })
  );

  // No validation on this route in the HTTP path either — id is passed through unchecked.
  ipcMain.handle(IPC.CATEGORY_SALE_GET_BY_ID, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const sale = await categorySaleService.getCategorySaleById(
        payload?.id as string | number
      );
      return buildSuccessPayload(StatusCodes.OK, sale, 'Category sale fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(
    IPC.CATEGORY_SALE_UPDATE,
    async (_event, payload: { id?: unknown } & Record<string, unknown>) =>
      withErrorHandling(async () => {
        const { params, body } = validateIpcPayload(UpdateCategorySaleSchema, {
          params: { id: payload?.id },
          body: payload,
        });
        const sale = await categorySaleService.updateCategorySale(
          (params as { id: number }).id,
          body as Parameters<typeof categorySaleService.updateCategorySale>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, sale, 'Category sale updated successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(
    IPC.CATEGORY_SALE_TOGGLE_STATUS,
    async (_event, payload: { id?: unknown; status?: unknown }) =>
      withErrorHandling(async () => {
        const { params, body } = validateIpcPayload(ToggleCategorySaleStatusSchema, {
          params: { id: payload?.id },
          body: { status: payload?.status },
        });
        const sale = await categorySaleService.toggleCategorySaleStatus(
          (params as { id: number }).id,
          (body as { status: 'draft' | 'active' | 'paused' }).status
        );
        return buildSuccessPayload(
          StatusCodes.OK,
          sale,
          'Category sale status updated successfully',
          { format: 'raw' }
        );
      })
  );

  ipcMain.handle(IPC.CATEGORY_SALE_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteCategorySaleSchema, {
        params: { id: payload?.id },
      });
      await categorySaleService.deleteCategorySale((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, null, 'Category sale deleted successfully', {
        format: 'raw',
      });
    })
  );

  // The HTTP controller re-reads category/discountPercentage from the raw
  // query rather than the validated output (String()/Number() coercion with
  // '' / 0 fallbacks) — matched exactly here, not just relying on the schema
  // parse, since that's what the route actually does today.
  ipcMain.handle(
    IPC.CATEGORY_SALE_PREVIEW,
    async (_event, payload: { category?: unknown; discountPercentage?: unknown }) =>
      withErrorHandling(async () => {
        validateIpcPayload(PreviewCategorySaleSchema, { query: payload });
        const category = String(payload?.category || '');
        const discountPercentage = Number(payload?.discountPercentage || 0);
        const previewItems = await categorySaleService.previewCategorySaleProducts(
          category,
          discountPercentage
        );
        return buildSuccessPayload(
          StatusCodes.OK,
          previewItems,
          'Category sale preview generated successfully',
          { format: 'raw' }
        );
      })
  );
};
