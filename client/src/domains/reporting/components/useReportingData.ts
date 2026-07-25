import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import dashboardService from '@/shared/api/dashboardService';
import { isRequestCanceled } from '@/shared/api/api';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';
import type { AxiosRequestConfig } from 'axios';
import type { ReportRange } from './reportingTimeframeUtils';
import { getReportRange, buildInclusiveRangeFromLocalDates } from '@/domains/reporting/components/reportingTimeframeUtils';

/**
 * Report payloads from /api/reports*. Shapes firm up once
 * server/src/domains/report is converted.
 * TODO(ts-migration): replace with the server's return types.
 */
type ReportPayload = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** One selectable period; `getValue` returns null for the Custom entry. */
export interface ReportTimeframe {
  label: string;
  getValue: () => ReportRange | null;
}

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export const useReportingData = (reportType?: string) => {
  const [reportData, setReportData] = useState<ReportPayload | null>(null);
  const [expiryData, setExpiryData] = useState<ReportPayload[] | null>(null);
  const [lowStockData, setLowStockData] = useState<ReportPayload[] | null>(null);
  const [looseSalesData, setLooseSalesData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState<ReportDateRange>({
    startDate: '',
    endDate: '',
  });

  const timeframes = useMemo<ReportTimeframe[]>(
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
    // KNOWN ISSUE (pre-existing, unchanged during TS conversion):
    // refreshLooseSales calls fetchReports() with no arguments as a fallback,
    // so start/end can be undefined. They are then fed to URLSearchParams,
    // which serialises them as the literal string "undefined" — the server
    // receives startDate=undefined. Typing them optional documents the real
    // contract; fixing it changes request behaviour and needs its own change.
    async (start?: string, end?: string, config: AxiosRequestConfig = {}) => {
      setLoading(true);
      try {
        if (reportType === 'expiry_report') {
          const data = await dashboardService.fetchExpiryReport(
            { startDate: start, endDate: end } as { startDate: string; endDate: string },
            config
          );
          setExpiryData(getResponseArray(data));
        } else if (reportType === 'low_stock') {
          const data = await dashboardService.fetchLowStockReport(config);
          setLowStockData(getResponseArray(data));
        } else if (reportType === 'loose_sales') {
          const data = await dashboardService.fetchLooseSalesReport(
            { startDate: start, endDate: end } as { startDate: string; endDate: string },
            config
          );
          setLooseSalesData(getResponseArray(data));
        } else {
          const data = await dashboardService.fetchPeriodicData(
            { startDate: start, endDate: end } as { startDate: string; endDate: string },
            config
          );
          setReportData(getResponseObject(data));
        }
      } catch (error) {
        if (isRequestCanceled(error)) return;
        Sentry.captureException(error, { tags: { feature: 'reports-fetch' } });
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
