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

    return {
        totalSales,
        totalProfit,
        totalOrders,
        salesCount: sales.length,
        sales: detailedSales
    };
};

module.exports = {
    getReports
};
