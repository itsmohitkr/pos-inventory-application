import { StatusCodes } from 'http-status-codes';
import type {
  FindOrCreateCustomerInput,
  UpdateCustomerInput,
} from './customer.validation';
import { randomBytes } from 'crypto';
import prisma = require('../../config/prisma');
import { createHttpError } from '../../shared/error/appError';

const BARCODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BARCODE_SUFFIX_LENGTH = 8;

const generateCustomerBarcode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = randomBytes(BARCODE_SUFFIX_LENGTH);
    let suffix = '';
    for (let i = 0; i < BARCODE_SUFFIX_LENGTH; i++) {
      suffix += BARCODE_CHARS[bytes[i] % BARCODE_CHARS.length];
    }
    const barcode = `CUST-${suffix}`;
    const existing = await prisma.customer.findUnique({ where: { customerBarcode: barcode } });
    if (!existing) return barcode;
  }
  throw createHttpError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Failed to generate unique customer barcode after 10 attempts',
    { error: 'Failed to generate unique customer barcode after 10 attempts' }
  );
};

const findOrCreateCustomer = async ({ phone, name }: FindOrCreateCustomerInput) => {
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) {
    // If customer exists but has no name, and we have one now, update it
    if (!existing.name && name) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: { name: name.trim() },
      });
      return { customer: updated, isNew: false };
    }
    return { customer: existing, isNew: false };
  }

  const customerBarcode = await generateCustomerBarcode();
  const customer = await prisma.customer.create({
    data: { phone, name: name?.trim() || null, customerBarcode },
  });
  return { customer, isNew: true };
};

const findByBarcode = async (barcode: string) => {
  const customer = await prisma.customer.findUnique({ where: { customerBarcode: barcode } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const findByPhone = async (phone: string) => {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const updateCustomer = async (id: number, { name, phone }: UpdateCustomerInput) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw createHttpError(404, 'Customer not found');

  if (phone && phone !== customer.phone) {
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) throw createHttpError(409, 'Phone number already registered to another customer');
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name || null }),
      ...(phone !== undefined && { phone }),
    },
  });

  return updated;
};

const getAllCustomers = async ({ page = 1, limit = 50, search = '', sortBy = 'createdAt', order = 'desc' }) => {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { phone: { contains: search } },
          { name: { contains: search } },
          { customerBarcode: { contains: search } },
        ],
      }
    : {};

  // Map frontend sort keys to Prisma sort objects
  // Prisma accepts several orderBy shapes here (scalar field, or a
  // relation _count); the union is wider than one inferred literal.
  let orderBy: Record<string, unknown> = { [sortBy]: order };
  
  if (sortBy === 'purchases') {
    orderBy = { sales: { _count: order } };
  } else if (sortBy === 'lastVisit') {
    orderBy = { lastVisit: order };
  } else if (sortBy === 'totalSpend') {
    orderBy = { totalSpend: order };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { sales: true } },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      },
    }),
    prisma.customer.count({ where }),
  ]);

  // Map to include fallback for lastVisit
  const customersWithFallback = customers.map(c => ({
    ...c,
    lastVisit: c.lastVisit || c.sales?.[0]?.createdAt || null
  }));

  return { customers: customersWithFallback, total, page, limit, sortBy, order };
};

const getCustomerById = async (id: number) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const getCustomerPurchaseHistory = async (customerId: number) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw createHttpError(404, 'Customer not found');

  const sales = await prisma.sale.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          batch: {
            select: {
              batchCode: true,
              product: { select: { id: true, name: true, category: true } },
            },
          },
        },
      },
    },
  });

  return { customer, sales };
};

export {
  findOrCreateCustomer,
  findByBarcode,
  findByPhone,
  updateCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseHistory,
};
