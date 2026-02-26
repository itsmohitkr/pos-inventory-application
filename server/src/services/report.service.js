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

    const [expenses, purchases] = await Promise.all([
        prisma.expense.findMany({ where: expenseWhere }),
        prisma.purchase.findMany({ where: expenseWhere })
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const netProfit = totalProfit - totalExpenses;
    const totalCashBalance = totalSales - totalExpenses - totalPurchases;

    return {
        totalSales,
        totalProfit,
        netProfit,
        totalCashBalance,
        totalExpenses,
        totalPurchases,
        expenses,
        purchases,
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

module.exports = {
    getReports,
    getExpiryReport,
    getLowStockReport
};
