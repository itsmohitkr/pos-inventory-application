import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import {
  buildCashFlowItems,
  buildCategorySegments,
} from '@/domains/reporting/components/analyticsUtils';
import AnalyticsCashFlowTable from '@/domains/reporting/components/AnalyticsCashFlowTable';
import AnalyticsPayoutSection from '@/domains/reporting/components/AnalyticsPayoutSection';
import AnalyticsCategoryBreakdown from '@/domains/reporting/components/AnalyticsCategoryBreakdown';

const AnalyticsPanel = ({ reportData, loading, reportType }) => {
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          bgcolor: '#ffffff',
        }}
      >
        <Box
          className="no-print"
          sx={{
            p: 2,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {reportType === 'cash_flow'
                ? 'Cash Flow Statement'
                : reportType === 'profit_payout'
                ? 'Profit & Payout'
                : 'Category Analytics'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reportType === 'cash_flow'
                ? 'Chronological breakdown of shop income, expenses, and purchases'
                : reportType === 'profit_payout'
                ? 'Net profit calculation and owner distribution breakdown'
                : 'Visual breakdown of expenses and purchase categories'}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            p: 2,
            overflowY: 'auto',
          }}
        >
          {reportType === 'cash_flow' && (
            <AnalyticsCashFlowTable
              totalSales={totalSales}
              cashFlowItems={cashFlowItems}
              totalCashBalance={totalCashBalance}
            />
          )}
          {reportType === 'profit_payout' && (
            <AnalyticsPayoutSection
              totalProfit={totalProfit}
              netProfit={netProfit}
              totalExpenses={totalExpenses}
            />
          )}
          {reportType === 'analytics' && (
            <AnalyticsCategoryBreakdown
              expenseSegments={expenseSegments}
              expenseGradient={expenseGradient}
              purchaseSegments={purchaseSegments}
              purchaseGradient={purchaseGradient}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyticsPanel;
