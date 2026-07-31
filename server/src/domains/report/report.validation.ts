import { z, int, dateRangeShape } from '../../shared/middleware/zodHelpers';

const dateRangeQuerySchema = z.object({ ...dateRangeShape() });

const monthlySalesQuerySchema = z.object({
  year: int().min(2000).max(2100).optional(),
});

const dailySalesQuerySchema = z.object({
  year: int().min(2000).max(2100).optional(),
  month: int().min(0).max(11).optional(),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const GetReportsSchema = { query: dateRangeQuerySchema };
export const GetExpiryReportSchema = { query: dateRangeQuerySchema };
export const GetMonthlySalesSchema = { query: monthlySalesQuerySchema };
export const GetDailySalesSchema = { query: dailySalesQuerySchema };
