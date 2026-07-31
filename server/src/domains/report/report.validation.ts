import { z, int, dateRangeShape } from '../../shared/middleware/zodHelpers';

const dateRangeQuerySchema = z.object({ ...dateRangeShape() });

const monthlySalesQuerySchema = z.object({
  year: int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier').optional(),
});

const dailySalesQuerySchema = z.object({
  year: int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier').optional(),
  month: int().min(0, 'Month must be between 0 and 11').max(11, 'Month must be between 0 and 11').optional(),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const GetReportsSchema = { query: dateRangeQuerySchema };
export const GetExpiryReportSchema = { query: dateRangeQuerySchema };
export const GetMonthlySalesSchema = { query: monthlySalesQuerySchema };
export const GetDailySalesSchema = { query: dailySalesQuerySchema };
