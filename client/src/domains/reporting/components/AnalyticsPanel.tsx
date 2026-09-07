import React from 'react';
import type { ReportData } from '@/shared/types/models';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import {
  buildCashFlowItems,
  buildCategorySegments,
} from '@/domains/reporting/components/analyticsUtils';
import AnalyticsCashFlowTable from '@/domains/reporting/components/AnalyticsCashFlowTable';
import AnalyticsPayoutSection from '@/domains/reporting/components/AnalyticsPayoutSection';
import AnalyticsCategoryBreakdown from '@/domains/reporting/components/AnalyticsCategoryBreakdown';
import ReportSummaryBar from '@/domains/reporting/components/ReportSummaryBar';

interface AnalyticsPanelProps {
  reportData?: ReportData | null;
  loading?: boolean;
  /** Which report is selected in the sidebar, e.g. 'sales' or 'low_stock'. */
  reportType?: string;
}

const AnalyticsPanel = ({ reportData, loading, reportType }: AnalyticsPanelProps) => {
  const cashFlowItems = React.useMemo(
    () => buildCashFlowItems(reportData?.expenses, reportData?.purchases),
    [reportData?.expenses, reportData?.purchases]
  );

  if (loading && !reportData) {
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
  const totalPurchases = reportData?.totalPurchases || 0;

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
            p: 1.5,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0b1d39', lineHeight: 1.2 }}>
              {reportType === 'cash_flow'
                ? 'Cash Flow Statement'
                : reportType === 'profit_payout'
                ? 'Profit & Payout'
                : 'Category Analytics'}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem', lineHeight: 1 }}>
              {reportType === 'cash_flow'
                ? 'Chronological breakdown of shop income, expenses, and purchases'
                : reportType === 'profit_payout'
                ? 'Net profit calculation and owner distribution breakdown'
                : 'Visual breakdown of expenses and purchase categories'}
            </Typography>
          </Box>


          {reportType === 'profit_payout' && (
            <ReportSummaryBar
              stats={[
                {
                  label: 'Gross Profit',
                  value: `₹${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#10b981',
                },
                {
                  label: 'Operating Expenses',
                  value: `-₹${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#ef4444',
                },
                {
                  label: 'Net Distributable Profit',
                  value: `₹${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#3b82f6',
                },
              ]}
            />
          )}

          {reportType === 'analytics' && (
            <ReportSummaryBar
              stats={[
                {
                  label: 'Total Sales',
                  value: `₹${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#3b82f6',
                },
                {
                  label: 'Operating Expenses',
                  value: `₹${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#ef4444',
                },
                {
                  label: 'Inventory Purchases',
                  value: `₹${totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#f59e0b',
                },
                {
                  label: 'Net Profit',
                  value: `₹${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  accentColor: '#10b981',
                },
              ]}
            />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
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
