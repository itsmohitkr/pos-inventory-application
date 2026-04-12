import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '../../shared/api/dashboardService';
import { isRequestCanceled } from '../../shared/api/api';
import { Container, Typography, Box, CircularProgress, Paper, Stack } from '@mui/material';

import ReportSidebar from './ReportSidebar';
import SaleDetailDialog from './SaleDetailDialog';
import ReportingTimeframeControls from './ReportingTimeframeControls';
import ReportingContent from './ReportingContent';
import { getReportRange, buildInclusiveRangeFromLocalDates } from './reportingTimeframeUtils';
import { getResponseArray, getResponseObject } from '../../shared/utils/responseGuards';

const Reporting = () => {
  const [reportData, setReportData] = useState(null);
  const [expiryData, setExpiryData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [looseSalesData, setLooseSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [reportType, setReportType] = useState('financial_summary'); // financial_summary, profit_margin, category_sales, expiry_report, item_sales, low_stock
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

  // Initial fetch and fetch on reportType change
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
      fetchReports(range.start, range.end);
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

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          m: 3,
          px: 4,
          py: 2.5,
          background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)',
          borderBottom: '1px solid rgba(16, 24, 40, 0.08)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}
            >
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gain insights into your sales, profits, and inventory trends.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <ReportingTimeframeControls
              reportType={reportType}
              tabValue={tabValue}
              timeframes={timeframes}
              dateRange={dateRange}
              onTabChange={handleTabChange}
              onDateRangeChange={(key, value) =>
                setDateRange((prev) => ({
                  ...prev,
                  [key]: value,
                }))
              }
              onApplyCustomRange={handleApplyCustomRange}
            />
          </Stack>
        </Box>
      </Paper>

      <Container
        disableGutters
        maxWidth={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, px: 3, pb: 3 }}
      >
        {loading && !reportData && !expiryData ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Left Sidebar - Report Selection */}
            <ReportSidebar reportType={reportType} onReportTypeChange={setReportType} />

            <ReportingContent
              reportType={reportType}
              reportData={reportData}
              expiryData={expiryData}
              lowStockData={lowStockData}
              looseSalesData={looseSalesData}
              loading={loading}
              tabValue={tabValue}
              timeframes={timeframes}
              onSelectSale={setSelectedSale}
              onRefreshLooseSales={refreshLooseSales}
            />
          </Box>
        )}

        <SaleDetailDialog selectedSale={selectedSale} onClose={() => setSelectedSale(null)} />
      </Container>
    </Box>
  );
};

export default Reporting;
