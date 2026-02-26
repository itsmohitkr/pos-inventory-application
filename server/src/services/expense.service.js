const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createExpense = async (data) => {
    return await prisma.expense.create({
        data: {
            amount: parseFloat(data.amount),
            category: data.category,
            description: data.description,
            date: data.date ? new Date(data.date) : new Date()
        }
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
    if (category) {
        where.category = category;
    }

    return await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' }
    });
};

const deleteExpense = async (id) => {
    return await prisma.expense.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    createExpense,
    getExpenses,
    deleteExpense
};
