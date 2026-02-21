const prisma = require('../config/prisma');

const createLooseSale = async ({ itemName, price }) => {
    return await prisma.looseSale.create({
        data: {
            itemName: itemName || 'Loose Item',
            price: parseFloat(price)
        }
    });
};

const getLooseSalesReport = async ({ startDate, endDate }) => {
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const items = await prisma.looseSale.findMany({
        where,
        orderBy: {
            createdAt: 'desc'
        }
    });

    return items;
};

module.exports = {
    createLooseSale,
    getLooseSalesReport
};
