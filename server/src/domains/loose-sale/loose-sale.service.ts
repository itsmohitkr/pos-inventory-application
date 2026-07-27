import prisma = require('../../config/prisma');
import type { CreateLooseSaleInput } from './loose-sale.validation';

const createLooseSale = async ({ itemName, price }: CreateLooseSaleInput) => {
  return await prisma.looseSale.create({
    data: {
      itemName: itemName || 'Loose Item',
      // `price` is already a number here: the schema coerces it, so the
      // previous parseFloat() was re-parsing an existing number.
      price,
    },
  });
};

const getLooseSalesReport = async ({ startDate, endDate }: {
  startDate?: string;
  endDate?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const items = await prisma.looseSale.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return items;
};

// The id param schema accepts a coerced number or a digit string.
const deleteLooseSale = async (id: string | number) => {
  return await prisma.looseSale.delete({
    where: { id: typeof id === 'number' ? id : parseInt(id, 10) },
  });
};

export {
  createLooseSale,
  getLooseSalesReport,
  deleteLooseSale,
};
