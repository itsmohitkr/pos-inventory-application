import React from 'react';
import { Box } from '@mui/material';
import AnalyticsPanel from './AnalyticsPanel';
import SalesHistory from './SalesHistory';
import CategorySalesPanel from './CategorySalesPanel';
import ExpiryReportPanel from './ExpiryReportPanel';
import ItemSalesReportPanel from './ItemSalesReportPanel';
import LowStockReportPanel from './LowStockReportPanel';
import LooseSalesReportPanel from './LooseSalesReportPanel';

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
      {reportType === 'financial_summary' ? (
        <AnalyticsPanel reportData={reportData} loading={loading} />
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
