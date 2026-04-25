import { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '@/shared/api/dashboardService';
import { isRequestCanceled } from '@/shared/api/api';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';
import { getReportRange, buildInclusiveRangeFromLocalDates } from '@/domains/reporting/components/reportingTimeframeUtils';

export const useReportingData = (reportType) => {
  const [reportData, setReportData] = useState(null);
  const [expiryData, setExpiryData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [looseSalesData, setLooseSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const timeframes = useMemo(
    () => [
      { label: 'Today', getValue: () => getReportRange('today') },
      { label: 'Yesterday', getValue: () => getReportRange('yesterday') },
      { label: 'This Week', getValue: () => getReportRange('thisWeek') },
      { label: 'Last Week', getValue: () => getReportRange('lastWeek') },
      { label: 'This Month', getValue: () => getReportRange('thisMonth') },
      { label: 'Last Month', getValue: () => getReportRange('lastMonth') },
      { label: 'This Year', getValue: () => getReportRange('thisYear') },
      { label: 'Last Year', getValue: () => getReportRange('lastYear') },
      { label: 'Custom', getValue: () => null },
    ],
    []
  );

  const fetchReports = useCallback(
    async (start, end, config = {}) => {
      setLoading(true);
      try {
        if (reportType === 'expiry_report') {
          const data = await dashboardService.fetchExpiryReport(
            { startDate: start, endDate: end },
            config
          );
          setExpiryData(getResponseArray(data));
        } else if (reportType === 'low_stock') {
          const data = await dashboardService.fetchLowStockReport(config);
          setLowStockData(getResponseArray(data));
        } else if (reportType === 'loose_sales') {
          const data = await dashboardService.fetchLooseSalesReport(
            { startDate: start, endDate: end },
            config
          );
          setLooseSalesData(getResponseArray(data));
        } else {
          const data = await dashboardService.fetchPeriodicData(
            { startDate: start, endDate: end },
            config
          );
          setReportData(getResponseObject(data));
        }
      } catch (error) {
        if (isRequestCanceled(error)) return;
        console.error('Error fetching reports:', error);
      } finally {
        if (!config.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [reportType]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (reportType === 'low_stock') {
      fetchReports(null, null, { signal: controller.signal });
      return () => controller.abort();
    }

    let range;
    if (tabValue < 8) {
      range = timeframes[tabValue].getValue();
    } else if (dateRange.startDate && dateRange.endDate) {
      range = buildInclusiveRangeFromLocalDates(dateRange.startDate, dateRange.endDate);
    }

    if (range && range.start && range.end) {
      fetchReports(range.start, range.end, { signal: controller.signal });
    }

    return () => controller.abort();
  }, [reportType, tabValue, dateRange, fetchReports, timeframes]);

  const handleTabChange = (event) => {
    const newValue = event.target.value;
    setTabValue(newValue);
    if (newValue < 8) {
      const range = timeframes[newValue].getValue();
      setDateRange({
        startDate: range.localStart,
        endDate: range.localEnd,
      });
    }
  };

  const handleApplyCustomRange = () => {
    const range = buildInclusiveRangeFromLocalDates(dateRange.startDate, dateRange.endDate);
    if (!range) return;
    fetchReports(range.start, range.end);
  };

  const refreshLooseSales = useCallback(() => {
    const customRange = buildInclusiveRangeFromLocalDates(dateRange.startDate, dateRange.endDate);
    if (customRange) {
      fetchReports(customRange.start, customRange.end);
      return;
    }

    if (tabValue < 8) {
      const range = timeframes[tabValue].getValue();
      fetchReports(range.start, range.end);
      return;
    }

    fetchReports();
  }, [dateRange.startDate, dateRange.endDate, fetchReports, tabValue, timeframes]);

  return {
    reportData,
    expiryData,
    lowStockData,
    looseSalesData,
    loading,
    tabValue,
    dateRange,
    timeframes,
    setDateRange,
    handleTabChange,
    handleApplyCustomRange,
    refreshLooseSales,
  };
};
