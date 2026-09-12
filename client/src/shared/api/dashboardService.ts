import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { dualCall } from '@/shared/api/ipc';
import { IPC } from '@/shared/ipcChannels';

/** Per-call axios options — used throughout for AbortController signals. */
type RequestConfig = AxiosRequestConfig;

/**
 * Date range for report queries.
 *
 * Both fields are required on purpose: these are fed straight into
 * URLSearchParams, which stringifies `undefined` to the literal "undefined"
 * and would send `startDate=undefined` to the server. Typing them as required
 * surfaces that at call sites instead of at runtime.
 */
export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

/** Arbitrary query params destined for URLSearchParams. */
type QueryParams = Record<string, string>;

/**
 * Dashboard Service
 * Centralizes all analytics and reporting related API calls.
 */
const dashboardService = {
  /**
   * Fetch KPI statistics for a given range
   */
  fetchStats: async (range: string, config: RequestConfig = {}) => {
    const response = await api.get('/api/reports', { ...config, params: { range } });
    return response.data;
  },

  /**
   * Fetch periodic data (e.g., for charts)
   */
  fetchPeriodicData: (
    { startDate, endDate }: DateRangeParams,
    config: RequestConfig = {}
  ) =>
    dualCall(isElectronProd, IPC.REPORT_GET_REPORTS, { startDate, endDate }, () => {
      const qs = new URLSearchParams({ startDate, endDate }).toString();
      return api.get(`/api/reports?${qs}`, config);
    }),

  /**
   * Fetch monthly comparison data
   */
  fetchMonthlyData: (year: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_MONTHLY, { year }, () =>
      api.get('/api/reports/monthly', { ...config, params: { year } })
    ),

  /**
   * Fetch daily data for a specific month
   */
  fetchDailyData: (year: number, month: number, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_DAILY, { year, month }, () =>
      api.get('/api/reports/daily', { ...config, params: { year, month } })
    ),

  /**
   * Fetch top selling products for POS stats
   */
  fetchTopSelling: (config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_TOP_SELLING, undefined, () =>
      api.get('/api/reports/top-selling', config)
    ),

  /**
   * Fetch expiry report
   */
  fetchExpiryReport: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_EXPIRY, params, () => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return api.get(qs ? `/api/reports/expiry?${qs}` : '/api/reports/expiry', config);
    }),

  /**
   * Fetch low stock report
   */
  fetchLowStockReport: (config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.REPORT_GET_LOW_STOCK, undefined, () =>
      api.get('/api/reports/low-stock', config)
    ),

  /**
   * Fetch loose sales report
   */
  fetchLooseSalesReport: (params?: QueryParams, config: RequestConfig = {}) =>
    dualCall(isElectronProd, IPC.LOOSE_SALE_GET_REPORT, params, () => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return api.get(qs ? `/api/reports/loose-sales?${qs}` : '/api/reports/loose-sales', config);
    }),
};

export default dashboardService;
