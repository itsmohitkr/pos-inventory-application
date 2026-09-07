import React, { useState } from 'react';
import { Typography, Box, CircularProgress, Paper, Stack, Container } from '@mui/material';

import ReportSidebar from '@/domains/reporting/components/ReportSidebar';
import ReportingTimeframeControls from '@/domains/reporting/components/ReportingTimeframeControls';
import ReportingContent from '@/domains/reporting/components/ReportingContent';
import { useReportingData } from '@/domains/reporting/components/useReportingData';
import type { ReportSale } from '@/shared/types/models';

const Reporting = () => {
  const [reportType, setReportType] = useState('cash_flow');
  const [selectedSale, setSelectedSale] = useState<ReportSale | null>(null);

  const {
    reportData,
    expiryData,
    lowStockData,
    looseSalesData,
    loading,
    initialLoading,
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
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          py: 1.5,
          px: { xs: 1.5, sm: 2 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* Top Control Bar */}
        <Paper
          elevation={0}
          className="no-print"
          sx={{
            p: 1.25,
            px: 2,
            mb: 1.5,
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            flexShrink: 0,
          }}
        >
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b1d39', fontSize: '1.1rem' }}>
                Reports & Analytics
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem' }}>
                Financial auditing, inventory risk, and real-time operations
              </Typography>
            </Box>

            <ReportingTimeframeControls
              reportType={reportType}
              tabValue={tabValue}
              timeframes={timeframes}
              dateRange={dateRange}
              onTabChange={handleTabChange}
              onDateRangeChange={(key: string, value: string) =>
                setDateRange((prev) => ({
                  ...prev,
                  [key]: value,
                }))
              }
              onApplyCustomRange={handleApplyCustomRange}
            />
          </Stack>
        </Paper>

        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              flex: 1,
              minHeight: 0,
            }}
          >
            <ReportSidebar
              reportType={reportType}
              onReportTypeChange={(newType) => {
                setSelectedSale(null);
                setReportType(newType);
              }}
            />

            <ReportingContent
              reportType={reportType}
              reportData={reportData}
              expiryData={expiryData}
              lowStockData={lowStockData}
              looseSalesData={looseSalesData}
              loading={loading}
              tabValue={tabValue}
              timeframes={timeframes}
              selectedSale={selectedSale}
              onSelectSale={setSelectedSale}
              onRefreshLooseSales={refreshLooseSales}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Reporting;
