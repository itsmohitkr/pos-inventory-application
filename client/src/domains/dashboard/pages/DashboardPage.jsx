import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import {
  formatShortNum,
  getDateRange,
} from '@/utils/dateUtils';

// Subcomponents
import StatCard from '@/domains/dashboard/components/StatCard';
import MonthlySalesChart from '@/domains/dashboard/components/MonthlySalesChart';
import DailySalesChart from '@/domains/dashboard/components/DailySalesChart';
import HourlySalesChart from '@/domains/dashboard/components/HourlySalesChart';
import DashboardHeader from '@/domains/dashboard/components/DashboardHeader';
import { TopProductsTable, CategoryMixChart } from '@/domains/dashboard/components/DashboardTables';
import { useDashboardData } from '@/domains/dashboard/hooks/useDashboardData';

const Dashboard = () => {
  const {
    report,
    monthlyData,
    dailyData,
    loading,
    selectedYear,
    setSelectedYear,
    selectedDailyYear,
    setSelectedDailyYear,
    selectedDailyMonth,
    setSelectedDailyMonth,
    isSyncingMonthly,
    isSyncingDaily,
    hourlyMetric,
    setHourlyMetric,
    dateRange,
    setDateRange,
    fetchPeriodicData,
    fetchMonthlyData,
    fetchDailyData,
    periodicMetrics,
    yearMetrics,
    dailyMetrics,
    categoryMixData,
  } = useDashboardData();

  const timeframes = [
    { label: 'Today', type: 'today' },
    { label: 'Yesterday', type: 'yesterday' },
    { label: 'This Month', type: 'thisMonth' },
    { label: 'Last Month', type: 'lastMonth' },
    { label: 'This Year', type: 'thisYear' },
    { label: 'Custom', type: 'custom' },
  ];

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
          tabValue={timeframes.findIndex(tf => {
            const { start, end } = getDateRange(tf.type);
            return start.toLocaleDateString('en-CA') === dateRange.startDate && 
                   end.toLocaleDateString('en-CA') === dateRange.endDate;
          }) === -1 ? timeframes.findIndex(tf => tf.type === 'custom') : timeframes.findIndex(tf => {
            const { start, end } = getDateRange(tf.type);
            return start.toLocaleDateString('en-CA') === dateRange.startDate && 
                   end.toLocaleDateString('en-CA') === dateRange.endDate;
          })}
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
