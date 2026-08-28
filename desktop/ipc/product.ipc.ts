// IPC handlers for the product domain — replaces product.router.ts /
// product.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
//
// Largest domain in the migration; two handlers (export/import) don't fit
// the JSON request/response shape the rest of the migration relies on:
//  - exportProducts returns a raw CSV string today (no sendSuccessResponse,
//    custom headers) — the IPC handler returns the CSV text directly as the
//    body with no wrapping, and the renderer builds the Blob/download itself
//    (see inventoryService.ts / InventoryPage.tsx).
//  - importProducts today reads a multer-uploaded file's buffer as UTF-8
//    text. FormData/multipart doesn't cross ipcRenderer.invoke the same way,
//    so the payload carries the already-decoded CSV text directly
//    ({ csvData: string }) instead of a File/FormData object — the renderer
//    reads the File via the File API's .text() before invoking.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildErrorPayload, buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type ProductServiceModule = typeof import('../../server/dist/src/domains/product/product.service');
type ProductValidationModule = typeof import('../../server/dist/src/domains/product/product.validation');

const productService: ProductServiceModule = require(
  resolveServerModulePath('src', 'domains', 'product', 'product.service')
);
const {
  GetAllProductsSchema,
  CreateProductSchema,
  GetProductSummarySchema,
  ValidateBarcodesSchema,
  GetProductByIdSchema,
  GetProductHistorySchema,
  GetProductByBarcodeSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  AddBatchSchema,
  UpdateBatchSchema,
  DeleteBatchSchema,
}: ProductValidationModule = require(
  resolveServerModulePath('src', 'domains', 'product', 'product.validation')
);

/** Same fallback semantics as queryStrOr/queryCount — a non-string payload field uses the default. */
const strOr = (value: unknown, fallback: string): string => (typeof value === 'string' && value !== '' ? value : fallback);
const countOr = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const registerProductIpc = (): void => {
  ipcMain.handle(
    IPC.PRODUCT_GET_ALL,
    async (
      _event,
      payload: {
        page?: unknown;
        pageSize?: unknown;
        search?: unknown;
        category?: unknown;
        sortBy?: unknown;
        sortOrder?: unknown;
        includeBatches?: unknown;
      }
    ) =>
      withErrorHandling(async () => {
        validateIpcPayload(GetAllProductsSchema, { query: payload ?? {} });
        const page = countOr(payload?.page, 1);
        const pageSize = countOr(payload?.pageSize, 25);
        const search = strOr(payload?.search, '');
        const category = strOr(payload?.category, 'all');
        const sortBy = strOr(payload?.sortBy, 'name');
        const sortOrder = strOr(payload?.sortOrder, 'asc');
        // Not strOr: ipcRenderer.invoke's structured clone preserves a real
        // boolean, unlike the HTTP path where axios stringifies query params
        // — a plain strOr(..., 'false') silently treats `true` (boolean) as
        // "not a string" and falls back to 'false', so every packaged build
        // took the plain getAllProducts path with no promotion/category-sale
        // pricing (no isOnSale/promoPrice), regardless of any active sale.
        const includeBatches = payload?.includeBatches === true || payload?.includeBatches === 'true';

        if (includeBatches) {
          const data = await productService.getAllProductsWithBatches({ search, category });
          return buildSuccessPayload(StatusCodes.OK, { data }, 'Products fetched successfully', {
            format: 'merge',
          });
        }

        const result = await productService.getAllProducts({
          page,
          pageSize,
          search,
          category,
          sortBy,
          sortOrder,
        });

        return buildSuccessPayload(
          StatusCodes.OK,
          { data: result.items, pagination: { page, pageSize, total: result.total } },
          'Products fetched successfully',
          { format: 'merge' }
        );
      })
  );

  ipcMain.handle(IPC.PRODUCT_GET_SUMMARY, async (_event, payload: { search?: unknown; category?: unknown }) =>
    withErrorHandling(async () => {
      validateIpcPayload(GetProductSummarySchema, { query: payload ?? {} });
      const search = strOr(payload?.search, '');
      const category = strOr(payload?.category, 'all');
      const data = await productService.getProductSummary({ search, category });
      return buildSuccessPayload(StatusCodes.OK, { data }, 'Product summary fetched successfully', {
        format: 'merge',
      });
    })
  );

  ipcMain.handle(IPC.PRODUCT_GET_BY_ID, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetProductByIdSchema, { params: { id: payload?.id } });
      const result = await productService.getProductById((params as { id: number | string }).id);
      return buildSuccessPayload(StatusCodes.OK, { data: result }, 'Product fetched successfully', {
        format: 'merge',
      });
    })
  );

  ipcMain.handle(IPC.PRODUCT_GET_BY_BARCODE, async (_event, payload: { barcode?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(GetProductByBarcodeSchema, { params: { barcode: payload?.barcode } });
      const result = await productService.getProductByBarcode((params as { barcode: string }).barcode);
      return buildSuccessPayload(StatusCodes.OK, result, 'Product fetched successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(
    IPC.PRODUCT_GET_HISTORY,
    async (_event, payload: { id?: unknown; range?: unknown; startDate?: unknown; endDate?: unknown }) =>
      withErrorHandling(async () => {
        const { params } = validateIpcPayload(GetProductHistorySchema, {
          params: { id: payload?.id },
          query: { range: payload?.range, startDate: payload?.startDate, endDate: payload?.endDate },
        });
        const range = strOr(payload?.range, 'today');
        const startDate = typeof payload?.startDate === 'string' ? payload.startDate : undefined;
        const endDate = typeof payload?.endDate === 'string' ? payload.endDate : undefined;
        const data = await productService.getProductHistory((params as { id: number | string }).id, {
          range,
          startDate,
          endDate,
        });
        return buildSuccessPayload(StatusCodes.OK, { data }, 'Product history fetched successfully', {
          format: 'merge',
        });
      })
  );

  ipcMain.handle(IPC.PRODUCT_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreateProductSchema, { body: payload });
      const result = await productService.createOrUpdateProduct(
        body as Parameters<typeof productService.createOrUpdateProduct>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, { id: result.id }, 'Product/Batch processed successfully', {
        format: 'merge',
      });
    })
  );

  ipcMain.handle(IPC.PRODUCT_ADD_BATCH, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(AddBatchSchema, { body: payload });
      const batch = await productService.addBatch(body as Parameters<typeof productService.addBatch>[0]);
      return buildSuccessPayload(StatusCodes.CREATED, { id: batch.id }, 'Batch added', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.PRODUCT_UPDATE, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdateProductSchema, { params: { id }, body });
      const product = await productService.updateProduct(
        (validated.params as { id: number | string }).id,
        validated.body as Parameters<typeof productService.updateProduct>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, product, 'Product updated successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.PRODUCT_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteProductSchema, { params: { id: payload?.id } });
      await productService.deleteProduct((params as { id: number | string }).id);
      return buildSuccessPayload(StatusCodes.OK, undefined, 'Product deleted successfully');
    })
  );

  ipcMain.handle(IPC.PRODUCT_UPDATE_BATCH, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(UpdateBatchSchema, { params: { id }, body });
      const batch = await productService.updateBatch(
        (validated.params as { id: number | string }).id,
        validated.body as Parameters<typeof productService.updateBatch>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, batch, 'Batch updated successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.PRODUCT_DELETE_BATCH, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteBatchSchema, { params: { id: payload?.id } });
      await productService.deleteBatch((params as { id: number | string }).id);
      return buildSuccessPayload(StatusCodes.OK, undefined, 'Batch deleted successfully');
    })
  );

  ipcMain.handle(IPC.PRODUCT_EXPORT, async () =>
    withErrorHandling(async () => {
      const csv = await productService.exportProducts();
      return { status: StatusCodes.OK, body: csv };
    })
  );

  ipcMain.handle(IPC.PRODUCT_IMPORT, async (_event, payload: { csvData?: unknown }) =>
    withErrorHandling(async () => {
      if (typeof payload?.csvData !== 'string' || payload.csvData.length === 0) {
        return buildErrorPayload(StatusCodes.BAD_REQUEST, 'No file uploaded', 'No file uploaded');
      }
      const result = await productService.importProducts(payload.csvData);
      return buildSuccessPayload(StatusCodes.OK, result, 'Products imported successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.PRODUCT_VALIDATE_BARCODES, async (_event, payload: { barcodes?: unknown }) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(ValidateBarcodesSchema, { body: { barcodes: payload?.barcodes } });
      const existingBarcodes = await productService.validateBarcodes(
        (body as { barcodes: string[] }).barcodes
      );
      return buildSuccessPayload(StatusCodes.OK, { existingBarcodes }, 'Barcode validation completed', {
        format: 'merge',
      });
    })
  );
};
