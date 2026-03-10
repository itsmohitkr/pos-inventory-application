const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPurchase = async (data) => {
    const { vendor, totalAmount, date, note, paidAmount, items = [] } = data;

    // Filter out invalid items (those without product IDs)
    const validItems = items.filter(item => item.productId && !isNaN(parseInt(item.productId)));

    const parsedTotalAmount = parseFloat(totalAmount) || 0;
    const parsedPaidAmount = parseFloat(paidAmount) || 0;

    // Derived status
    let initialPaymentStatus = 'Paid';
    if (parsedPaidAmount < parsedTotalAmount && parsedPaidAmount > 0) initialPaymentStatus = 'Due';
    if (parsedPaidAmount === 0 && parsedTotalAmount > 0) initialPaymentStatus = 'Unpaid';

    return await prisma.$transaction(async (tx) => {
        const purchaseData = {
            vendor,
            totalAmount: parsedTotalAmount,
            date: date ? new Date(date) : new Date(),
            note,
            paymentStatus: initialPaymentStatus
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
            include: { items: true, payments: true }
        });

        // Record the initial payment if an amount was given
        if (parsedPaidAmount > 0) {
            await tx.purchasePayment.create({
                data: {
                    purchaseId: purchase.id,
                    amount: parsedPaidAmount,
                    date: purchase.date,
                    note: 'Initial payment upon logging purchase'
                }
            });
            purchase.payments = [{ amount: parsedPaidAmount, date: purchase.date, note: 'Initial payment upon logging purchase' }];
        }

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

    const purchases = await prisma.purchase.findMany({
        where,
        include: { items: true, payments: { orderBy: { date: 'desc' } } },
        orderBy: { date: 'desc' }
    });

    // Compute due amount and correct status dynamically based on payments
    return purchases.map(p => {
        const totalPaid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
        const dueAmount = Math.max(0, p.totalAmount - totalPaid);
        let currentStatus = p.paymentStatus;
        if (dueAmount <= 0) currentStatus = 'Paid';
        else if (totalPaid > 0 && dueAmount > 0) currentStatus = 'Due';
        else if (totalPaid === 0) currentStatus = 'Unpaid';

        return { ...p, totalPaid, dueAmount, paymentStatus: currentStatus };
    });
};

const deletePurchase = async (id) => {
    return await prisma.purchase.delete({
        where: { id: parseInt(id) }
    });
};

const updatePurchase = async (id, data) => {
    const { vendor, totalAmount, date, note, paymentStatus, items = [] } = data;

    // Filter out invalid items (those without product IDs)
    const validItems = items.filter(item => item.productId && !isNaN(parseInt(item.productId)));

    return await prisma.$transaction(async (tx) => {
        const purchaseData = {
            vendor,
            totalAmount: parseFloat(totalAmount) || 0,
            date: date ? new Date(date) : new Date(),
            note,
            paymentStatus: paymentStatus || 'Paid'
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
            include: { items: true, payments: true }
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

const addPayment = async (purchaseId, paymentData) => {
    const { amount, date, note } = paymentData;

    return await prisma.$transaction(async (tx) => {
        const payment = await tx.purchasePayment.create({
            data: {
                purchaseId: parseInt(purchaseId),
                amount: parseFloat(amount) || 0,
                date: date ? new Date(date) : new Date(),
                note
            }
        });

        // Check if fully paid to update the parent status
        const purchase = await tx.purchase.findUnique({
            where: { id: parseInt(purchaseId) },
            include: { payments: true }
        });

        const totalPaid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= purchase.totalAmount) {
            await tx.purchase.update({
                where: { id: parseInt(purchaseId) },
                data: { paymentStatus: 'Paid' }
            });
        } else {
            await tx.purchase.update({
                where: { id: parseInt(purchaseId) },
                data: { paymentStatus: 'Due' }
            });
        }

        return payment;
    });
};

module.exports = {
    createPurchase,
    getPurchases,
    deletePurchase,
    updatePurchase,
    addPayment
};
