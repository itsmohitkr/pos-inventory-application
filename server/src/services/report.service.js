const prisma = require('../config/prisma');

const getReports = async ({ startDate, endDate }) => {
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const sales = await prisma.sale.findMany({
        where,
        include: {
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
                                    category: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    let totalSales = 0;
    let totalProfit = 0;
    let totalOrders = sales.length;

    const detailedSales = sales.map(sale => {
        let saleProfit = 0;
        let saleNetTotal = 0;

        const items = sale.items.map(item => {
            const netQuantity = item.quantity - item.returnedQuantity;
            const itemProfit = (item.sellingPrice - item.costPrice) * netQuantity;
            const itemNetTotal = item.sellingPrice * netQuantity;

            saleProfit += itemProfit;
            saleNetTotal += itemNetTotal;

            const margin = item.sellingPrice > 0
                ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100
                : 0;

            return {
                ...item,
                productName: item.batch.product.name,
                mrp: item.mrp,
                profit: itemProfit,
                margin: margin.toFixed(2),
                netQuantity // Include netQuantity helper
            };
        });

        // Net sale amount considering discount and returns
        // We assume the discount applies to the remaining items or the overall bill
        const extraDiscount = sale.extraDiscount || 0;
        const finalSaleNetTotal = saleNetTotal - sale.discount - extraDiscount;
        const finalSaleProfit = saleProfit - sale.discount - extraDiscount;

        totalSales += finalSaleNetTotal;
        totalProfit += finalSaleProfit;

        return {
            ...sale,
            netTotalAmount: finalSaleNetTotal,
            profit: finalSaleProfit,
            items
        };
    });

    // Recalculate based on net amounts
    totalSales = detailedSales.reduce((sum, s) => sum + s.netTotalAmount, 0);
    totalProfit = detailedSales.reduce((sum, s) => sum + s.profit, 0);

    // Fetch Expenses and Purchases for the same period
    const expenseWhere = {};
    if (startDate && endDate) {
        expenseWhere.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const [expenses, purchases, looseSales] = await Promise.all([
        prisma.expense.findMany({ where: expenseWhere }),
        prisma.purchase.findMany({ where: expenseWhere }),
        prisma.looseSale.findMany({ where })
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
        sales: detailedSales
    };
};

const getExpiryReport = async ({ startDate, endDate }) => {
    const where = {};
    if (startDate && endDate) {
        where.expiryDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const batches = await prisma.batch.findMany({
        where: {
            ...where,
            quantity: { gt: 0 } // Only show batches that still have stock
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    barcode: true,
                    category: true
                }
            }
        },
        orderBy: {
            expiryDate: 'asc'
        }
    });

    return batches.map(batch => ({
        ...batch,
        productName: batch.product?.name || 'Unknown',
        category: batch.product?.category || 'Uncategorized',
        barcode: batch.product?.barcode
    }));
};

const getLowStockReport = async () => {
    const products = await prisma.product.findMany({
        include: {
            batches: {
                select: {
                    quantity: true
                }
            }
        }
    });

    return products
        .map(product => {
            const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
            return {
                ...product,
                totalQuantity
            };
        })
        .filter(product => product.totalQuantity <= product.lowStockThreshold);
};

const getMonthlySales = async ({ year }) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            items: true
        }
    });

    // Initialize exactly 12 months inside the object mapping
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i, // 0-11 indexing
        totalSales: 0,
        totalProfit: 0,
        orderCount: 0
    }));

    const looseSales = await prisma.looseSale.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    sales.forEach(sale => {
        const monthIndex = new Date(sale.createdAt).getMonth();
        let saleProfit = 0;
        let saleNetTotal = 0;

        sale.items.forEach(item => {
            const netQuantity = item.quantity - item.returnedQuantity;
            saleProfit += (item.sellingPrice - item.costPrice) * netQuantity;
            saleNetTotal += item.sellingPrice * netQuantity;
        });

        const extraDiscount = sale.extraDiscount || 0;
        const finalSaleNetTotal = saleNetTotal - sale.discount - extraDiscount;
        const finalSaleProfit = saleProfit - sale.discount - extraDiscount;

        monthlyData[monthIndex].totalSales += finalSaleNetTotal;
        monthlyData[monthIndex].totalProfit += finalSaleProfit;
        monthlyData[monthIndex].orderCount += 1;
    });

    looseSales.forEach(ls => {
        const monthIndex = new Date(ls.createdAt).getMonth();
        monthlyData[monthIndex].totalSales += ls.price;
        // profit not calculated for loose sales
    });

    return monthlyData;
};

const getTopSellingProducts = async ({ limit = 100 } = {}) => {
    const saleItems = await prisma.saleItem.groupBy({
        by: ['batchId'],
        _sum: {
            quantity: true
        }
    });

    const batchIds = saleItems.map(si => si.batchId);
    const batches = await prisma.batch.findMany({
        where: { id: { in: batchIds } },
        select: { id: true, productId: true }
    });

    const productSales = {};
    saleItems.forEach(si => {
        const batch = batches.find(b => b.id === si.batchId);
        if (batch) {
            productSales[batch.productId] = (productSales[batch.productId] || 0) + si._sum.quantity;
        }
    });

    return productSales;
};

module.exports = {
    getReports,
    getExpiryReport,
    getLowStockReport,
    getMonthlySales,
    getTopSellingProducts
};
