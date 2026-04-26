import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { buildCashFlowItems, buildCategorySegments } from '@/domains/reporting/components/analyticsUtils';
import AnalyticsCashFlowTable from '@/domains/reporting/components/AnalyticsCashFlowTable';
import AnalyticsPayoutSection from '@/domains/reporting/components/AnalyticsPayoutSection';
import AnalyticsCategoryBreakdown from '@/domains/reporting/components/AnalyticsCategoryBreakdown';

const AnalyticsPanel = ({ reportData, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  const totalSales = reportData?.totalSales || 0;
  const totalProfit = reportData?.totalProfit || 0;
  const netProfit = reportData?.netProfit || 0;
  const totalCashBalance = reportData?.totalCashBalance || 0;
  const totalExpenses = reportData?.totalExpenses || 0;

  const cashFlowItems = buildCashFlowItems(reportData?.expenses, reportData?.purchases);
  const { segments: expenseSegments, gradient: expenseGradient } = buildCategorySegments(
    reportData?.expenses || [],
    'amount',
    'category'
  );
  const { segments: purchaseSegments, gradient: purchaseGradient } = buildCategorySegments(
    reportData?.purchases || [],
    'totalAmount',
    'vendor'
  );

  return (
    <Box
      sx={{
        bgcolor: '#fcfcfc',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        overflowY: 'auto',
        borderRadius: 1,
      }}
    >
      <AnalyticsCashFlowTable
        totalSales={totalSales}
        cashFlowItems={cashFlowItems}
        totalCashBalance={totalCashBalance}
      />
      <AnalyticsPayoutSection
        totalProfit={totalProfit}
        netProfit={netProfit}
        totalExpenses={totalExpenses}
      />
      <AnalyticsCategoryBreakdown
        expenseSegments={expenseSegments}
        expenseGradient={expenseGradient}
        purchaseSegments={purchaseSegments}
        purchaseGradient={purchaseGradient}
      />
    </Box>
  );
};

export default AnalyticsPanel;
