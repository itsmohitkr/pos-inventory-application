import React from 'react';
import { Box } from '@mui/material';
import AnalyticsPanel from '@/domains/reporting/components/AnalyticsPanel';
import SalesHistory from '@/domains/reporting/components/SalesHistory';
import CategorySalesPanel from '@/domains/reporting/components/CategorySalesPanel';
import ExpiryReportPanel from '@/domains/reporting/components/ExpiryReportPanel';
import ItemSalesReportPanel from '@/domains/reporting/components/ItemSalesReportPanel';
import LowStockReportPanel from '@/domains/reporting/components/LowStockReportPanel';
import LooseSalesReportPanel from '@/domains/reporting/components/LooseSalesReportPanel';

const ReportingContent = ({
  reportType,
  reportData,
  expiryData,
  lowStockData,
  looseSalesData,
  loading,
  tabValue,
  timeframes,
  onSelectSale,
  onRefreshLooseSales,
}) => {
  const timeframeLabel = tabValue === 8 ? 'Custom' : timeframes[tabValue]?.label;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {['cash_flow', 'profit_payout', 'analytics'].includes(reportType) ? (
        <AnalyticsPanel reportData={reportData} loading={loading} reportType={reportType} />
      ) : reportType === 'profit_margin' ? (
        <SalesHistory
          sales={reportData?.sales}
          timeframeLabel={timeframes[tabValue]?.label}
          onSelectSale={onSelectSale}
        />
      ) : reportType === 'category_sales' ? (
        <CategorySalesPanel sales={reportData?.sales || []} />
      ) : reportType === 'expiry_report' ? (
        <ExpiryReportPanel data={expiryData} loading={loading} timeframeLabel={timeframeLabel} />
      ) : reportType === 'item_sales' ? (
        <ItemSalesReportPanel
          sales={reportData?.sales}
          loading={loading}
          timeframeLabel={timeframeLabel}
        />
      ) : reportType === 'low_stock' ? (
        <LowStockReportPanel data={lowStockData} loading={loading} />
      ) : (
        <LooseSalesReportPanel
          data={looseSalesData}
          loading={loading}
          timeframeLabel={timeframeLabel}
          onRefresh={onRefreshLooseSales}
        />
      )}
    </Box>
  );
};

export default React.memo(ReportingContent);
