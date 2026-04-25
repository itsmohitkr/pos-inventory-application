import api from '@/shared/api/api';

/**
 * Dashboard Service
 * Centralizes all analytics and reporting related API calls.
 */
const dashboardService = {
  /**
   * Fetch KPI statistics for a given range
   */
  fetchStats: async (range, config = {}) => {
    const response = await api.get('/api/reports', { ...config, params: { range } });
    return response.data;
  },

  /**
   * Fetch periodic data (e.g., for charts)
   */
  fetchPeriodicData: async ({ startDate, endDate } = {}, config = {}) => {
    const qs = new URLSearchParams({ startDate, endDate }).toString();
    const response = await api.get(`/api/reports?${qs}`, config);
    return response.data;
  },

  /**
   * Fetch monthly comparison data
   */
  fetchMonthlyData: async (year, config = {}) => {
    const response = await api.get('/api/reports/monthly', { ...config, params: { year } });
    return response.data;
  },

  /**
   * Fetch daily data for a specific month
   */
  fetchDailyData: async (year, month, config = {}) => {
    const response = await api.get('/api/reports/daily', { ...config, params: { year, month } });
    return response.data;
  },

  /**
   * Fetch top selling products for POS stats
   */
  fetchTopSelling: async (config = {}) => {
    const response = await api.get('/api/reports/top-selling', config);
    return response.data;
  },

  /**
   * Fetch expiry report
   */
  fetchExpiryReport: async (params, config = {}) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    const response = await api.get(qs ? `/api/reports/expiry?${qs}` : '/api/reports/expiry', config);
    return response.data;
  },

  /**
   * Fetch low stock report
   */
  fetchLowStockReport: async (config = {}) => {
    const response = await api.get('/api/reports/low-stock', config);
    return response.data;
  },

  /**
   * Fetch loose sales report
   */
  fetchLooseSalesReport: async (params, config = {}) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    const response = await api.get(qs ? `/api/reports/loose-sales?${qs}` : '/api/reports/loose-sales', config);
    return response.data;
  },
};

export default dashboardService;
