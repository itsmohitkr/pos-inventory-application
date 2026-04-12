import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import dashboardService from '../shared/api/dashboardService';
import {
  CATEGORY_COLORS,
  formatShortNum,
  formatDateDisplay,
  getDateRange,
} from '../utils/dateUtils';

// Subcomponents
import StatCard from '../components/Dashboard/StatCard';
import MonthlySalesChart from '../components/Dashboard/MonthlySalesChart';
import DailySalesChart from '../components/Dashboard/DailySalesChart';
import HourlySalesChart from '../components/Dashboard/HourlySalesChart';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import { TopProductsTable, CategoryMixChart } from '../components/Dashboard/DashboardTables';

const Dashboard = () => {
  const [report, setReport] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDailyYear, setSelectedDailyYear] = useState(new Date().getFullYear());
  const [selectedDailyMonth, setSelectedDailyMonth] = useState(new Date().getMonth());
  const [isSyncingMonthly, setIsSyncingMonthly] = useState(false);
  const [isSyncingDaily, setIsSyncingDaily] = useState(false);
  const [hourlyMetric, setHourlyMetric] = useState('amount');

  const localToday = new Date().toLocaleDateString('en-CA');
  const [dateRange, setDateRange] = useState({
    startDate: localToday,
    endDate: localToday,
  });

  const timeframes = [
    { label: 'Today', type: 'today' },
    { label: 'Yesterday', type: 'yesterday' },
    { label: 'This Month', type: 'thisMonth' },
    { label: 'Last Month', type: 'lastMonth' },
    { label: 'This Year', type: 'thisYear' },
    { label: 'Custom', type: 'custom' },
  ];

  const fetchPeriodicData = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const data = await dashboardService.fetchPeriodicData(start, end);
      setReport(data);
    } catch (error) {
      console.error('Failed to load periodic report data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyData = useCallback(
    async (year) => {
      setIsSyncingMonthly(true);
      try {
        const data = await dashboardService.fetchMonthlyData(year || selectedYear);
        setMonthlyData(data || []);
      } catch (error) {
        console.error('Failed to load monthly sales data:', error);
      } finally {
        setIsSyncingMonthly(false);
      }
    },
    [selectedYear]
  );

  const fetchDailyData = useCallback(async (year, month) => {
    setIsSyncingDaily(true);
    try {
      const data = await dashboardService.fetchDailyData(year, month);
      setDailyData(data || []);
    } catch (error) {
      console.error('Failed to load daily sales data:', error);
    } finally {
      setIsSyncingDaily(false);
    }
  }, []);

  useEffect(() => {
    const { start, end } = getDateRange('today');
    fetchPeriodicData(start.toISOString(), end.toISOString());
    fetchMonthlyData(selectedYear);
    fetchDailyData(selectedDailyYear, selectedDailyMonth);
  }, [
    fetchPeriodicData,
    fetchMonthlyData,
    fetchDailyData,
    selectedYear,
    selectedDailyYear,
    selectedDailyMonth,
  ]);

  const handlePrevYear = () => {
    const prevYear = selectedYear - 1;
    setSelectedYear(prevYear);
    fetchMonthlyData(prevYear);
  };

  const handleNextYear = () => {
    const nextYear = selectedYear + 1;
    setSelectedYear(nextYear);
    fetchMonthlyData(nextYear);
  };

  const handlePrevDailyMonth = () => {
    let newMonth = selectedDailyMonth - 1;
    let newYear = selectedDailyYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setSelectedDailyMonth(newMonth);
    setSelectedDailyYear(newYear);
    fetchDailyData(newYear, newMonth);
  };

  const handleNextDailyMonth = () => {
    let newMonth = selectedDailyMonth + 1;
    let newYear = selectedDailyYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setSelectedDailyMonth(newMonth);
    setSelectedDailyYear(newYear);
    fetchDailyData(newYear, newMonth);
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
    const timeframe = timeframes[newValue];
    if (timeframe.type !== 'custom') {
      const { start, end } = getDateRange(timeframe.type);
      setDateRange({
        startDate: start.toLocaleDateString('en-CA'),
        endDate: end.toLocaleDateString('en-CA'),
      });
      fetchPeriodicData(start.toISOString(), end.toISOString());
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      fetchPeriodicData(start.toISOString(), end.toISOString());
    }
  };

  const periodicMetrics = useMemo(() => {
    const sales = report?.sales || [];
    const looseSales = report?.looseSales || [];
    const totalSalesAmount = report?.totalSales || 0;

    const productTotals = new Map();
    const categoryTotals = new Map();
    let totalCostAmount = 0;

    const hourlySalesAmt = Array.from({ length: 24 }, () => 0);
    const hourlySalesQty = Array.from({ length: 24 }, () => 0);

    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      const saleHour = saleDate.getHours();

      hourlySalesAmt[saleHour] += sale.netTotalAmount || 0;

      sale.items.forEach((item) => {
        const qty = item.netQuantity ?? item.quantity - item.returnedQuantity;
        hourlySalesQty[saleHour] += qty;

        const name = item.productName || item.batch?.product?.name || 'Unknown';
        const category = item.batch?.product?.category || 'Uncategorized';

        productTotals.set(name, (productTotals.get(name) || 0) + item.sellingPrice * qty);
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + item.sellingPrice * qty);
        totalCostAmount += (item.costPrice || 0) * qty;
      });
    });

    let totalLooseSalesAmount = 0;
    let firstHour = 24;
    let lastHour = -1;

    sales.forEach((sale) => {
      const h = new Date(sale.createdAt).getHours();
      if (h < firstHour) firstHour = h;
      if (h > lastHour) lastHour = h;
    });

    looseSales.forEach((ls) => {
      const lsHour = new Date(ls.createdAt).getHours();
      totalLooseSalesAmount += ls.price;
      hourlySalesAmt[lsHour] += ls.price;
      hourlySalesQty[lsHour] += 1;

      if (lsHour < firstHour) firstHour = lsHour;
      if (lsHour > lastHour) lastHour = lsHour;
    });

    const startHour = lastHour === -1 ? 0 : Math.max(0, firstHour - 1);
    const endHour = lastHour === -1 ? 23 : Math.min(23, lastHour + 1);

    const topProducts = [...productTotals.entries()].sort((a, b) => b[1] - a[1]);
    const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);

    const activeHourlyData = hourlyMetric === 'amount' ? hourlySalesAmt : hourlySalesQty;
    const maxHourlyVal = Math.max(...activeHourlyData, 0);

    const totalTransactions = (report?.sales?.length || 0) + (report?.looseSales?.length || 0);
    const avgSaleValue = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

    const regularSalesAmount = totalSalesAmount - totalLooseSalesAmount;
    const regularProfitAmount = regularSalesAmount - totalCostAmount;
    const netProfitMargin =
      regularSalesAmount > 0 ? (regularProfitAmount / regularSalesAmount) * 100 : 0;

    return {
      totalSalesAmount,
      totalLooseSalesAmount,
      topProducts,
      topCategories,
      activeHourlyData,
      maxHourlyVal,
      startHour,
      endHour,
      totalTransactions,
      avgSaleValue,
      netProfitMargin,
    };
  }, [report, hourlyMetric]);

  const yearMetrics = useMemo(() => {
    if (!monthlyData?.length)
      return { totalYearlySales: 0, topMonthName: 'N/A', topMonthVal: 0, maxMonthVal: 0 };
    let total = 0,
      highest = { month: 0, val: 0 },
      maxMonthVal = 0;

    monthlyData.forEach((m) => {
      total += m.totalSales;
      if (m.totalSales > highest.val) highest = { month: m.month, val: m.totalSales };
      if (m.totalSales > maxMonthVal) maxMonthVal = m.totalSales;
    });

    return {
      totalYearlySales: total,
      topMonthName:
        formatDateDisplay(new Date(selectedYear, highest.month, 1)).split(' ')[1] || 'N/A',
      topMonthVal: highest.val,
      maxMonthVal,
    };
  }, [monthlyData, selectedYear]);

  const dailyMetrics = useMemo(() => {
    return { maxDailyVal: Math.max(...(dailyData.map((d) => d.totalSales) || [0]), 0) };
  }, [dailyData]);

  const categoryMixData = useMemo(() => {
    const entries = periodicMetrics.topCategories || [];
    const total = entries.reduce((sum, [, val]) => sum + val, 0) || 1;

    const segments = entries.map((entry, index) => ({
      name: entry[0],
      value: entry[1],
      percent: (entry[1] / total) * 100,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

    let cumulative = 0;
    const gradient = segments
      .map((stop) => {
        const start = cumulative;
        cumulative += stop.percent;
        return `${stop.color} ${start}% ${cumulative}%`;
      })
      .join(', ');

    return { segments, gradient: gradient ? `conic-gradient(${gradient})` : 'none' };
  }, [periodicMetrics.topCategories]);

  if (loading && !report) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', height: '100%', overflowY: 'auto', p: 2 }}>
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
          <MonthlySalesChart
            data={monthlyData}
            year={selectedYear}
            onPrevYear={handlePrevYear}
            onNextYear={handleNextYear}
            onSync={() => fetchMonthlyData(selectedYear)}
            loading={isSyncingMonthly}
            maxVal={yearMetrics.maxMonthVal}
          />
          <StatCard
            title="Total Sales"
            value={formatShortNum(yearMetrics.totalYearlySales)}
            footerLabel="Top performing month:"
            footerValue={`${yearMetrics.topMonthName} (Rs. ${formatShortNum(yearMetrics.topMonthVal)})`}
            width="300px"
          />
        </Box>

        <DailySalesChart
          data={dailyData}
          year={selectedDailyYear}
          month={selectedDailyMonth}
          onPrevMonth={handlePrevDailyMonth}
          onNextMonth={handleNextDailyMonth}
          onSync={() => fetchDailyData(selectedDailyYear, selectedDailyMonth)}
          loading={isSyncingDaily}
          maxVal={dailyMetrics.maxDailyVal}
        />

        <DashboardHeader
          dateRange={dateRange}
          tabValue={tabValue}
          timeframes={timeframes}
          onTabChange={handleTabChange}
          onStartDateChange={(val) => setDateRange({ ...dateRange, startDate: val })}
          onEndDateChange={(val) => setDateRange({ ...dateRange, endDate: val })}
          onApplyCustomRange={handleApplyCustomRange}
        />

        <Box sx={{ display: 'flex', gap: 2, height: '300px' }}>
          <TopProductsTable products={periodicMetrics.topProducts} />
          <HourlySalesChart
            activeHourlyData={periodicMetrics.activeHourlyData}
            maxHourlyVal={periodicMetrics.maxHourlyVal}
            startHour={periodicMetrics.startHour}
            endHour={periodicMetrics.endHour}
            metric={hourlyMetric}
            onMetricChange={setHourlyMetric}
          />
          <StatCard
            title="Total Sales (Period)"
            value={formatShortNum(periodicMetrics.totalSalesAmount)}
            subtitle={
              periodicMetrics.totalLooseSalesAmount > 0
                ? `(Includes Rs.${periodicMetrics.totalLooseSalesAmount.toFixed(2)} loose sales)`
                : ''
            }
            bgcolor="#fff"
            textColor="#64748b"
            valueColor="#374151"
            width="30%"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, height: '220px', mb: 4 }}>
          <CategoryMixChart mix={categoryMixData} />
          <StatCard
            title="Average Sale Value"
            subtitle={`Across ${periodicMetrics.totalTransactions} transactions`}
            value={`Rs.${formatShortNum(periodicMetrics.avgSaleValue)}`}
            bgcolor="#fff"
            textColor="#64748b"
            valueColor="#0b1d39"
            width="35%"
          />
          <StatCard
            title="Net Profit Margin"
            subtitle="Estimated aggregate markup"
            value={`${periodicMetrics.netProfitMargin.toFixed(1)}%`}
            bgcolor="#0b1d39"
            valueColor="#10b981"
            width="35%"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
