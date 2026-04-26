import { useState, useEffect, useCallback, useMemo } from 'react';
import dashboardService from '@/shared/api/dashboardService';
import { getDateRange, CATEGORY_COLORS } from '@/utils/dateUtils';

export const useDashboardData = () => {
  const [report, setReport] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchPeriodicData = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const data = await dashboardService.fetchPeriodicData({ startDate: start, endDate: end });
      setReport(data);
    } catch (error) {
      console.error('Failed to load periodic report data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyData = useCallback(async (year) => {
    setIsSyncingMonthly(true);
    try {
      const data = await dashboardService.fetchMonthlyData(year);
      setMonthlyData(data || []);
    } catch (error) {
      console.error('Failed to load monthly sales data:', error);
    } finally {
      setIsSyncingMonthly(false);
    }
  }, []);

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
  }, [fetchPeriodicData, fetchMonthlyData, fetchDailyData, selectedYear, selectedDailyYear, selectedDailyMonth]);

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
    const netProfitMargin = regularSalesAmount > 0 ? (regularProfitAmount / regularSalesAmount) * 100 : 0;

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
    if (!monthlyData?.length) return { totalYearlySales: 0, topMonthName: 'N/A', topMonthVal: 0, maxMonthVal: 0 };
    let total = 0, highest = { month: 0, val: 0 }, maxMonthVal = 0;
    monthlyData.forEach((m) => {
      total += m.totalSales;
      if (m.totalSales > highest.val) highest = { month: m.month, val: m.totalSales };
      if (m.totalSales > maxMonthVal) maxMonthVal = m.totalSales;
    });
    return {
      totalYearlySales: total,
      topMonthName: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(selectedYear, highest.month, 1)),
      topMonthVal: highest.val,
      maxMonthVal,
    };
  }, [monthlyData, selectedYear]);

  const dailyMetrics = useMemo(() => ({
    maxDailyVal: dailyData.reduce((max, d) => (d.totalSales > max ? d.totalSales : max), 0),
  }), [dailyData]);

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
    const gradient = segments.map((stop) => {
      const start = cumulative;
      cumulative += stop.percent;
      return `${stop.color} ${start}% ${cumulative}%`;
    }).join(', ');
    return { segments, gradient: gradient ? `conic-gradient(${gradient})` : 'none' };
  }, [periodicMetrics.topCategories]);

  return {
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
  };
};
