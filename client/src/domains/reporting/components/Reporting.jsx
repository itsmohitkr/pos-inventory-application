import React, { useState } from 'react';
import { Typography, Box, CircularProgress, Paper, Stack, Container } from '@mui/material';

import ReportSidebar from '@/domains/reporting/components/ReportSidebar';
import SaleDetailDialog from '@/domains/reporting/components/SaleDetailDialog';
import ReportingTimeframeControls from '@/domains/reporting/components/ReportingTimeframeControls';
import ReportingContent from '@/domains/reporting/components/ReportingContent';
import { useReportingData } from '@/domains/reporting/components/useReportingData';

const Reporting = () => {
  const [reportType, setReportType] = useState('financial_summary');
  const [selectedSale, setSelectedSale] = useState(null);

  const {
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
  } = useReportingData(reportType);

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
          m: 2.5,
          px: 3,
          py: 2.25,
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
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, px: 2.5, pb: 2.5 }}
      >
        {loading && !reportData && !expiryData && !lowStockData && !looseSalesData ? (
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
              gap: 2.5,
              flex: 1,
              minHeight: 0,
            }}
          >
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
