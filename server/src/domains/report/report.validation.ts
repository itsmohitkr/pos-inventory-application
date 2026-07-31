import { z, int, dateRangeShape } from '../../shared/middleware/zodHelpers';

/** Shared by GetReports and GetExpiryReport. */
const dateRangeQuerySchema = z.object({ ...dateRangeShape() });

/** One grouped schema per router route, named after the controller handler it validates for. */
export const GetReportsSchema = { query: dateRangeQuerySchema };
export const GetExpiryReportSchema = { query: dateRangeQuerySchema };

export const GetMonthlySalesSchema = {
  query: z.object({
    year: int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier').optional(),
  }),
};

export const GetDailySalesSchema = {
  query: z.object({
    year: int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier').optional(),
    month: int().min(0, 'Month must be between 0 and 11').max(11, 'Month must be between 0 and 11').optional(),
  }),
};
