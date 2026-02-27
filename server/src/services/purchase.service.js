const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPurchase = async (data) => {
    const { vendor, totalAmount, date, note, items = [] } = data;

    // Filter out invalid items (those without product IDs)
    const validItems = items.filter(item => item.productId && !isNaN(parseInt(item.productId)));

    return await prisma.$transaction(async (tx) => {
        const purchaseData = {
            vendor,
            totalAmount: parseFloat(totalAmount) || 0,
            date: date ? new Date(date) : new Date(),
            note,
        };

        if (validItems.length > 0) {
            purchaseData.items = {
                create: validItems.map(item => ({
                    productId: parseInt(item.productId),
                    batchId: item.batchId ? parseInt(item.batchId) : null,
                    quantity: parseInt(item.quantity) || 0,
                    costPrice: parseFloat(item.costPrice) || 0
                }))
            };
        }

        const purchase = await tx.purchase.create({
            data: purchaseData,
            include: { items: true }
        });

        // Optionally update batch cost price if batchId is provided
        for (const item of validItems) {
            if (item.batchId) {
                await tx.batch.update({
                    where: { id: parseInt(item.batchId) },
                    data: { costPrice: parseFloat(item.costPrice) || 0 }
                });
            }
        }

        return purchase;
    });
};

const getPurchases = async (filters = {}) => {
    const { startDate, endDate, vendor } = filters;

    let where = {};
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }
    if (vendor) {
        where.vendor = { contains: vendor };
    }

    return await prisma.purchase.findMany({
        where,
        include: { items: true },
        orderBy: { date: 'desc' }
    });
};

const deletePurchase = async (id) => {
    return await prisma.purchase.delete({
        where: { id: parseInt(id) }
    });
};

const updatePurchase = async (id, data) => {
    const { vendor, totalAmount, date, note, items = [] } = data;

    // Filter out invalid items (those without product IDs)
    const validItems = items.filter(item => item.productId && !isNaN(parseInt(item.productId)));

    return await prisma.$transaction(async (tx) => {
        const purchaseData = {
            vendor,
            totalAmount: parseFloat(totalAmount) || 0,
            date: date ? new Date(date) : new Date(),
            note,
        };

        // If items are provided, delete old ones and create new ones
        if (validItems.length > 0) {
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: parseInt(id) }
            });

            purchaseData.items = {
                create: validItems.map(item => ({
                    productId: parseInt(item.productId),
                    batchId: item.batchId ? parseInt(item.batchId) : null,
                    quantity: parseInt(item.quantity) || 0,
                    costPrice: parseFloat(item.costPrice) || 0
                }))
            };
        }

        const purchase = await tx.purchase.update({
            where: { id: parseInt(id) },
            data: purchaseData,
            include: { items: true }
        });

        // Optionally update batch cost price if batchId is provided
        for (const item of validItems) {
            if (item.batchId) {
                await tx.batch.update({
                    where: { id: parseInt(item.batchId) },
                    data: { costPrice: parseFloat(item.costPrice) || 0 }
                });
            }
        }

        return purchase;
    });
};

module.exports = {
    createPurchase,
    getPurchases,
    deletePurchase,
    updatePurchase
};
