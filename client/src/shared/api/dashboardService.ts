import type { AxiosRequestConfig } from 'axios';
import api, { isElectronProd } from '@/shared/api/api';
import { invokeIpc } from '@/shared/api/ipc';
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
  fetchPeriodicData: async (
    { startDate, endDate }: DateRangeParams,
    config: RequestConfig = {}
  ) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_REPORTS, { startDate, endDate });
    }
    const qs = new URLSearchParams({ startDate, endDate }).toString();
    const response = await api.get(`/api/reports?${qs}`, config);
    return response.data;
  },

  /**
   * Fetch monthly comparison data
   */
  fetchMonthlyData: async (year: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_MONTHLY, { year });
    }
    const response = await api.get('/api/reports/monthly', { ...config, params: { year } });
    return response.data;
  },

  /**
   * Fetch daily data for a specific month
   */
  fetchDailyData: async (year: number, month: number, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_DAILY, { year, month });
    }
    const response = await api.get('/api/reports/daily', { ...config, params: { year, month } });
    return response.data;
  },

  /**
   * Fetch top selling products for POS stats
   */
  fetchTopSelling: async (config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_TOP_SELLING);
    }
    const response = await api.get('/api/reports/top-selling', config);
    return response.data;
  },

  /**
   * Fetch expiry report
   */
  fetchExpiryReport: async (params?: QueryParams, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_EXPIRY, params);
    }
    const qs = params ? new URLSearchParams(params).toString() : '';
    const response = await api.get(qs ? `/api/reports/expiry?${qs}` : '/api/reports/expiry', config);
    return response.data;
  },

  /**
   * Fetch low stock report
   */
  fetchLowStockReport: async (config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.REPORT_GET_LOW_STOCK);
    }
    const response = await api.get('/api/reports/low-stock', config);
    return response.data;
  },

  /**
   * Fetch loose sales report
   */
  fetchLooseSalesReport: async (params?: QueryParams, config: RequestConfig = {}) => {
    if (isElectronProd) {
      return invokeIpc(IPC.LOOSE_SALE_GET_REPORT, params);
    }
    const qs = params ? new URLSearchParams(params).toString() : '';
    const response = await api.get(qs ? `/api/reports/loose-sales?${qs}` : '/api/reports/loose-sales', config);
    return response.data;
  },
};

export default dashboardService;
