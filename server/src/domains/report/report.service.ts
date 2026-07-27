import prisma = require('../../config/prisma');
import type { Prisma, Sale, SaleItem } from '@prisma/client';

/** Optional ISO date bounds shared by every report query. */
interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/**
 * The SaleItem fields the report maths reads. Structural (rather than the full
 * model) so the helpers work with any query that selects at least these, and
 * derived from Prisma so a schema change breaks here rather than silently
 * producing wrong money.
 */
type ReportSaleItem = Pick<
  SaleItem,
  'quantity' | 'returnedQuantity' | 'sellingPrice' | 'costPrice'
>;

/** The Sale fields the report maths reads, plus its items. */
interface ReportSale extends Pick<Sale, 'discount' | 'extraDiscount'> {
  items: ReportSaleItem[];
}

/**
 * Net quantity actually kept by the customer (sold minus returned).
 */
const getNetQuantity = (item: ReportSaleItem): number =>
  item.quantity - item.returnedQuantity;

/**
 * Per-sale money maths, shared by every report so the summary, monthly, and
 * daily views can never disagree about what profit means. Returns gross figures
 * (before sale-level discounts) plus the discount-adjusted finals.
 */
const calculateSaleTotals = (sale: ReportSale) => {
  let grossProfit = 0;
  let grossNetTotal = 0;

  sale.items.forEach((item) => {
    const netQuantity = getNetQuantity(item);
    grossProfit += (item.sellingPrice - item.costPrice) * netQuantity;
    grossNetTotal += item.sellingPrice * netQuantity;
  });

  const extraDiscount = sale.extraDiscount || 0;
  const totalDiscount = sale.discount + extraDiscount;

  return {
    grossProfit,
    grossNetTotal,
    netTotal: grossNetTotal - totalDiscount,
    profit: grossProfit - totalDiscount,
  };
};

const getReports = async ({ startDate, endDate }: DateRangeFilter) => {
  // Reused for both sales and loose sales — both filter on createdAt.
  const where: Prisma.SaleWhereInput & Prisma.LooseSaleWhereInput = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          batch: {
            select: {
              id: true,
              batchCode: true,
              expiryDate: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let totalSales = 0;
  let totalProfit = 0;

  const detailedSales = sales.map((sale) => {
    const items = sale.items.map((item) => {
      const netQuantity = getNetQuantity(item);
      const itemProfit = (item.sellingPrice - item.costPrice) * netQuantity;

      const margin =
        item.sellingPrice > 0
          ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100
          : 0;

      return {
        ...item,
        productName: item.batch.product.name,
        mrp: item.mrp,
        profit: itemProfit,
        margin: margin.toFixed(2),
        netQuantity, // Include netQuantity helper
      };
    });

    // Net sale amount considering discount and returns.
    // The discount applies to the overall bill, not per line item.
    const { netTotal, profit } = calculateSaleTotals(sale);

    totalSales += netTotal;
    totalProfit += profit;

    return {
      ...sale,
      netTotalAmount: netTotal,
      profit,
      items,
    };
  });

  // Recalculate based on net amounts
  totalSales = detailedSales.reduce((sum, s) => sum + s.netTotalAmount, 0);
  totalProfit = detailedSales.reduce((sum, s) => sum + s.profit, 0);

  // Fetch Expenses and Purchases for the same period
  // Reused for both expenses and purchases — both filter on date.
  const expenseWhere: Prisma.ExpenseWhereInput & Prisma.PurchaseWhereInput = {};
  if (startDate || endDate) {
    expenseWhere.date = {};
    if (startDate) expenseWhere.date.gte = new Date(startDate);
    if (endDate) expenseWhere.date.lte = new Date(endDate);
  }

  const [expenses, purchases, looseSales] = await Promise.all([
    prisma.expense.findMany({ where: expenseWhere }),
    prisma.purchase.findMany({ where: expenseWhere }),
    prisma.looseSale.findMany({ where }),
  ]);

  const totalLooseSales = looseSales.reduce((sum, ls) => sum + ls.price, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const netProfit = totalProfit - totalExpenses;
  const totalCashBalance = totalSales - totalExpenses - totalPurchases;

  return {
    totalSales: totalSales + totalLooseSales,
    totalProfit, // Loose sales profit not tracked for now as cost is unknown
    netProfit,
    totalCashBalance: totalCashBalance + totalLooseSales,
    totalExpenses,
    totalPurchases,
    expenses,
    purchases,
    looseSales,
    totalOrders: sales.length,
    salesCount: sales.length,
    sales: detailedSales,
  };
};

const getExpiryReport = async ({ startDate, endDate }: DateRangeFilter) => {
  const where: Prisma.BatchWhereInput = {};
  if (startDate || endDate) {
    where.expiryDate = {};
    if (startDate) where.expiryDate.gte = new Date(startDate);
    if (endDate) where.expiryDate.lte = new Date(endDate);
  }

  const batches = await prisma.batch.findMany({
    where: {
      ...where,
      quantity: { gt: 0 }, // Only show batches that still have stock
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
          category: true,
        },
      },
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });

  return batches.map((batch) => ({
    ...batch,
    productName: batch.product?.name || 'Unknown',
    category: batch.product?.category || 'Uncategorized',
    barcode: batch.product?.barcode,
  }));
};

const getLowStockReport = async () => {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: {
      batches: {
        select: {
          quantity: true,
          mrp: true,
        },
      },
    },
  });

  return products
    .map((product) => {
      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);

      // Derive mrp from the most recently added batch if it exists
      const mrp = product.batches.length > 0 ? product.batches[product.batches.length - 1].mrp : 0;

      return {
        ...product,
        totalQuantity,
        mrp,
      };
    })
    .filter((product) => product.totalQuantity <= product.lowStockThreshold);
};

const getMonthlySales = async ({ year }: { year: number }) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: true,
    },
  });

  // Initialize exactly 12 months inside the object mapping
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i, // 0-11 indexing
    totalSales: 0,
    totalProfit: 0,
    orderCount: 0,
  }));

  const looseSales = await prisma.looseSale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  sales.forEach((sale) => {
    const monthIndex = new Date(sale.createdAt).getMonth();
    const { netTotal, profit } = calculateSaleTotals(sale);

    monthlyData[monthIndex].totalSales += netTotal;
    monthlyData[monthIndex].totalProfit += profit;
    monthlyData[monthIndex].orderCount += 1;
  });

  looseSales.forEach((ls) => {
    const monthIndex = new Date(ls.createdAt).getMonth();
    monthlyData[monthIndex].totalSales += ls.price;
    // profit not calculated for loose sales
  });

  return monthlyData;
};

const getDailySales = async ({ year, month }: { year: number; month: number }) => {
  // Note: month is 0-indexed (0 = Jan, 11 = Dec)
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of the requested month

  // Get the exact number of days in this month
  const daysInMonth = endDate.getDate();

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: true,
    },
  });

  const looseSales = await prisma.looseSale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Initialize array for each day (1 to daysInMonth)
  // Array index 0 represents day 1. Length is `daysInMonth`.
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    totalSales: 0,
    totalProfit: 0,
    orderCount: 0,
  }));

  sales.forEach((sale) => {
    // Date.getDate() returns 1-31. We subtract 1 to get the 0-based array index.
    const dayIndex = new Date(sale.createdAt).getDate() - 1;
    const { netTotal, profit } = calculateSaleTotals(sale);

    dailyData[dayIndex].totalSales += netTotal;
    dailyData[dayIndex].totalProfit += profit;
    dailyData[dayIndex].orderCount += 1;
  });

  looseSales.forEach((ls) => {
    const dayIndex = new Date(ls.createdAt).getDate() - 1;
    dailyData[dayIndex].totalSales += ls.price;
    // profit not calculated for loose sales
  });

  return dailyData;
};

// Returns a productId -> total-quantity-sold map, unranked and unpaginated.
// This previously took a `limit` option that was never applied to the result;
// the only caller (GET /api/reports/top-selling, consumed by usePOSData to rank
// search results) needs the full map, so the option is gone rather than
// silently doing nothing.
const getTopSellingProducts = async () => {
  const saleItems = await prisma.saleItem.groupBy({
    by: ['batchId'],
    _sum: {
      quantity: true,
    },
  });

  const batchIds = saleItems.map((si) => si.batchId);
  const batches = await prisma.batch.findMany({
    where: { id: { in: batchIds } },
    select: { id: true, productId: true },
  });

  // productId -> total quantity sold.
  const productSales: Record<number, number> = {};
  saleItems.forEach((si) => {
    const batch = batches.find((b) => b.id === si.batchId);
    if (batch) {
      productSales[batch.productId] = (productSales[batch.productId] || 0) + si._sum.quantity;
    }
  });

  return productSales;
};

export {
  getReports,
  getExpiryReport,
  getLowStockReport,
  getMonthlySales,
  getDailySales,
  getTopSellingProducts,
};
