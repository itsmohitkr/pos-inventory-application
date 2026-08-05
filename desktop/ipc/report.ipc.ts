// IPC handlers for the report domain — read-only, no mutations. Replaces
// report.router.ts / report.controller.ts for packaged builds / electron-dev.
// See category.ipc.ts and the IPC migration plan for the shared pattern.
//
// The HTTP controllers manually coerce req.query strings via queryStr/queryInt
// (Express 5's req.query can't be rewritten by validation). An IPC payload is
// already a plain object with real types, so there's no equivalent coercion
// step needed here — validateIpcPayload's schemas (z.coerce.*) accept either
// shape, same as they already do for the HTTP path.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type ReportServiceModule = typeof import('../../server/dist/src/domains/report/report.service');
type ReportValidationModule = typeof import('../../server/dist/src/domains/report/report.validation');

const reportService: ReportServiceModule = require(
  resolveServerModulePath('src', 'domains', 'report', 'report.service')
);
const {
  GetReportsSchema,
  GetExpiryReportSchema,
  GetMonthlySalesSchema,
  GetDailySalesSchema,
}: ReportValidationModule = require(
  resolveServerModulePath('src', 'domains', 'report', 'report.validation')
);

export const registerReportIpc = (): void => {
  ipcMain.handle(IPC.REPORT_GET_REPORTS, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetReportsSchema, { query: payload ?? {} });
      const stats = await reportService.getReports(
        query as Parameters<typeof reportService.getReports>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, stats, 'Reports fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.REPORT_GET_EXPIRY, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetExpiryReportSchema, { query: payload ?? {} });
      const expiringBatches = await reportService.getExpiryReport(
        query as Parameters<typeof reportService.getExpiryReport>[0]
      );
      return buildSuccessPayload(
        StatusCodes.OK,
        expiringBatches,
        'Expiry report fetched successfully',
        { format: 'raw' }
      );
    })
  );

  ipcMain.handle(IPC.REPORT_GET_LOW_STOCK, async () =>
    withErrorHandling(async () => {
      const lowStockProducts = await reportService.getLowStockReport();
      return buildSuccessPayload(
        StatusCodes.OK,
        lowStockProducts,
        'Low stock report fetched successfully',
        { format: 'raw' }
      );
    })
  );

  ipcMain.handle(IPC.REPORT_GET_MONTHLY, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetMonthlySalesSchema, { query: payload ?? {} });
      const parsed = query as { year?: number };
      const stats = await reportService.getMonthlySales({
        year: parsed.year ?? new Date().getFullYear(),
      });
      return buildSuccessPayload(StatusCodes.OK, stats, 'Monthly sales fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.REPORT_GET_DAILY, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { query } = validateIpcPayload(GetDailySalesSchema, { query: payload ?? {} });
      const parsed = query as { year?: number; month?: number };
      const stats = await reportService.getDailySales({
        year: parsed.year ?? new Date().getFullYear(),
        month: parsed.month ?? new Date().getMonth(),
      });
      return buildSuccessPayload(StatusCodes.OK, stats, 'Daily sales fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.REPORT_GET_TOP_SELLING, async () =>
    withErrorHandling(async () => {
      const stats = await reportService.getTopSellingProducts();
      return buildSuccessPayload(
        StatusCodes.OK,
        stats,
        'Top-selling products fetched successfully',
        { format: 'raw' }
      );
    })
  );
};
