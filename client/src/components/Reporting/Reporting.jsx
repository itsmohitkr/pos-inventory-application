import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '../../shared/api/dashboardService';
import { isRequestCanceled } from '../../shared/api/api';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';

// Sub-components
import SalesHistory from './SalesHistory';
import AnalyticsPanel from './AnalyticsPanel';
import ExpiryReportPanel from './ExpiryReportPanel';
import ItemSalesReportPanel from './ItemSalesReportPanel';
import LowStockReportPanel from './LowStockReportPanel';
import LooseSalesReportPanel from './LooseSalesReportPanel';
import CategorySalesPanel from './CategorySalesPanel';
import ReportSidebar from './ReportSidebar';
import SaleDetailDialog from './SaleDetailDialog';
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

  const getRange = useCallback((type) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (type) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case 'thisWeek': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
        break;
      }
      case 'lastWeek': {
        const day = now.getDay();
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 7, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 1, 23, 59, 59, 999);
        break;
      }
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        break;
    }
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      localStart: start.toLocaleDateString('en-CA'),
      localEnd: end.toLocaleDateString('en-CA'),
    };
  }, []);

  const timeframes = useMemo(
    () => [
      { label: 'Today', getValue: () => getRange('today') },
      { label: 'Yesterday', getValue: () => getRange('yesterday') },
      { label: 'This Week', getValue: () => getRange('thisWeek') },
      { label: 'Last Week', getValue: () => getRange('lastWeek') },
      { label: 'This Month', getValue: () => getRange('thisMonth') },
      { label: 'Last Month', getValue: () => getRange('lastMonth') },
      { label: 'This Year', getValue: () => getRange('thisYear') },
      { label: 'Last Year', getValue: () => getRange('lastYear') },
      { label: 'Custom', getValue: () => null },
    ],
    [getRange]
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
      // For custom range, ensure we use inclusive local boundaries
      const [sy, sm, sd] = dateRange.startDate.split('-').map(Number);
      const [ey, em, ed] = dateRange.endDate.split('-').map(Number);

      if (!isNaN(sy) && !isNaN(ey)) {
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        range = { start: start.toISOString(), end: end.toISOString() };
      }
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
    if (dateRange.startDate && dateRange.endDate) {
      const [sy, sm, sd] = dateRange.startDate.split('-').map(Number);
      const [ey, em, ed] = dateRange.endDate.split('-').map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      fetchReports(start.toISOString(), end.toISOString());
    }
  };

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
            {reportType !== 'low_stock' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Frame</InputLabel>
                <Select value={tabValue} label="Time Frame" onChange={handleTabChange}>
                  {timeframes.map((tf, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {tf.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {tabValue === 8 && reportType !== 'low_stock' && (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={dateRange.startDate || ''}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      startDate: e.target.value,
                    })
                  }
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={dateRange.endDate || ''}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      endDate: e.target.value,
                    })
                  }
                />
                <Button variant="outlined" onClick={handleApplyCustomRange} sx={{ height: 40 }}>
                  Apply
                </Button>
              </>
            )}
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

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {reportType === 'financial_summary' ? (
                <AnalyticsPanel reportData={reportData} loading={loading} />
              ) : reportType === 'profit_margin' ? (
                <SalesHistory
                  sales={reportData?.sales}
                  timeframeLabel={timeframes[tabValue].label}
                  onSelectSale={setSelectedSale}
                />
              ) : reportType === 'category_sales' ? (
                <CategorySalesPanel sales={reportData?.sales || []} />
              ) : reportType === 'expiry_report' ? (
                <ExpiryReportPanel
                  data={expiryData}
                  loading={loading}
                  timeframeLabel={tabValue === 8 ? 'Custom' : timeframes[tabValue].label}
                />
              ) : reportType === 'item_sales' ? (
                <ItemSalesReportPanel
                  sales={reportData?.sales}
                  loading={loading}
                  timeframeLabel={tabValue === 8 ? 'Custom' : timeframes[tabValue].label}
                />
              ) : reportType === 'low_stock' ? (
                <LowStockReportPanel data={lowStockData} loading={loading} />
              ) : (
                <LooseSalesReportPanel
                  data={looseSalesData}
                  loading={loading}
                  timeframeLabel={tabValue === 8 ? 'Custom' : timeframes[tabValue].label}
                  onRefresh={() => {
                    if (dateRange.startDate && dateRange.endDate) {
                      const [sy, sm, sd] = dateRange.startDate.split('-').map(Number);
                      const [ey, em, ed] = dateRange.endDate.split('-').map(Number);
                      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
                      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
                      fetchReports(start.toISOString(), end.toISOString());
                    } else if (tabValue < 8) {
                      const range = timeframes[tabValue].getValue();
                      fetchReports(range.start, range.end);
                    } else {
                      fetchReports();
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        <SaleDetailDialog selectedSale={selectedSale} onClose={() => setSelectedSale(null)} />
      </Container>
    </Box>
  );
};

export default Reporting;
