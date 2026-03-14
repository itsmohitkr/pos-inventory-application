const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to append current time to a date string (YYYY-MM-DD)
const getDateWithCurrentTime = (dateString) => {
    if (!dateString) return new Date();
    const dateObj = new Date(dateString);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return dateObj;
};

const createExpense = async (data) => {
    const { amount, category, description, date, paidAmount, paymentMethod } = data;

    const parsedAmount = parseFloat(amount) || 0;
    const parsedPaidAmount = parseFloat(paidAmount) || 0;

    // Derived status
    let initialPaymentStatus = 'Paid';
    if (parsedPaidAmount < parsedAmount && parsedPaidAmount > 0) initialPaymentStatus = 'Due';
    if (parsedPaidAmount === 0 && parsedAmount > 0) initialPaymentStatus = 'Unpaid';

    return await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
            data: {
                amount: parsedAmount,
                category,
                description,
                date: date ? getDateWithCurrentTime(date) : new Date(),
                paymentStatus: initialPaymentStatus,
                paymentMethod: paymentMethod || 'Cash'
            }
        });

        // Record the initial payment if an amount was given
        if (parsedPaidAmount > 0) {
            await tx.expensePayment.create({
                data: {
                    expenseId: expense.id,
                    amount: parsedPaidAmount,
                    paymentMethod: paymentMethod || 'Cash',
                    date: expense.date,
                    note: 'Initial payment'
                }
            });
        }

        return expense;
    });
};

const getExpenses = async (filters = {}) => {
    const { startDate, endDate, category } = filters;

    let where = {};
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }
    if (category && category !== 'All') {
        where.category = category;
    }

    const expenses = await prisma.expense.findMany({
        where,
        include: { payments: { orderBy: { date: 'asc' } } },
        orderBy: { date: 'desc' }
    });

    // Compute due amount and correct status dynamically based on payments
    return expenses.map(e => {
        const totalPaid = e.payments.reduce((sum, p) => sum + p.amount, 0);
        const dueAmount = Math.max(0, e.amount - totalPaid);
        let currentStatus = e.paymentStatus;
        if (dueAmount <= 0) currentStatus = 'Paid';
        else if (totalPaid > 0 && dueAmount > 0) currentStatus = 'Due';
        else if (totalPaid === 0) currentStatus = 'Unpaid';

        return { ...e, totalPaid, dueAmount, paymentStatus: currentStatus };
    });
};

const deleteExpense = async (id) => {
    return await prisma.expense.delete({
        where: { id: parseInt(id) }
    });
};

const updateExpense = async (id, data) => {
    const { amount, category, description, date, paymentStatus, paymentMethod } = data;
    return await prisma.expense.update({
        where: { id: parseInt(id) },
        data: {
            amount: amount !== undefined ? parseFloat(amount) : undefined,
            category,
            description,
            date: date ? new Date(date) : undefined,
            paymentStatus,
            paymentMethod
        }
    });
};

// Internal helper to sync expense status after payment changes
const syncExpenseStatus = async (expenseId, tx) => {
    const expense = await (tx || prisma).expense.findUnique({
        where: { id: parseInt(expenseId) },
        include: { payments: true }
    });

    const totalPaid = expense.payments.reduce((sum, p) => sum + p.amount, 0);
    let newStatus = 'Unpaid';
    if (totalPaid >= expense.amount) {
        newStatus = 'Paid';
    } else if (totalPaid > 0) {
        newStatus = 'Due';
    }

    await (tx || prisma).expense.update({
        where: { id: expense.id },
        data: { paymentStatus: newStatus }
    });
};

const addPayment = async (expenseId, paymentData) => {
    const { amount, date, note, paymentMethod } = paymentData;

    return await prisma.$transaction(async (tx) => {
        const payment = await tx.expensePayment.create({
            data: {
                expenseId: parseInt(expenseId),
                amount: parseFloat(amount) || 0,
                paymentMethod: paymentMethod || 'Cash',
                date: date ? getDateWithCurrentTime(date) : new Date(),
                note
            }
        });

        await syncExpenseStatus(expenseId, tx);
        return payment;
    });
};

const updatePayment = async (paymentId, paymentData) => {
    const { amount, date, note, paymentMethod } = paymentData;
    const pid = parseInt(paymentId);

    return await prisma.$transaction(async (tx) => {
        const payment = await tx.expensePayment.update({
            where: { id: pid },
            data: {
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                paymentMethod,
                date: date ? getDateWithCurrentTime(date) : undefined,
                note
            }
        });

        await syncExpenseStatus(payment.expenseId, tx);
        return payment;
    });
};

const deletePayment = async (paymentId) => {
    const pid = parseInt(paymentId);

    return await prisma.$transaction(async (tx) => {
        const payment = await tx.expensePayment.findUnique({
            where: { id: pid }
        });

        if (!payment) throw new Error('Payment not found');

        await tx.expensePayment.delete({
            where: { id: pid }
        });

        await syncExpenseStatus(payment.expenseId, tx);
        return { success: true };
    });
};

module.exports = {
    createExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    addPayment,
    updatePayment,
    deletePayment
};
