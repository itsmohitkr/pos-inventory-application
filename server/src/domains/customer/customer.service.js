const { randomBytes } = require('crypto');
const prisma = require('../../config/prisma');
const { createHttpError } = require('../../shared/error/appError');

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
  throw new Error('Failed to generate unique customer barcode after 10 attempts');
};

const findOrCreateCustomer = async ({ phone, name }) => {
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) return { customer: existing, isNew: false };

  const customerBarcode = await generateCustomerBarcode();
  const customer = await prisma.customer.create({
    data: { phone, name: name || null, customerBarcode },
  });
  return { customer, isNew: true };
};

const findByBarcode = async (barcode) => {
  const customer = await prisma.customer.findUnique({ where: { customerBarcode: barcode } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const findByPhone = async (phone) => {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const updateCustomer = async (id, { name, phone }) => {
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

const getAllCustomers = async ({ page = 1, limit = 50, search = '' }) => {
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

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sales: true } },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, totalAmount: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, limit };
};

const getCustomerById = async (id) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw createHttpError(404, 'Customer not found');
  return customer;
};

const getCustomerPurchaseHistory = async (customerId) => {
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

module.exports = {
  findOrCreateCustomer,
  findByBarcode,
  findByPhone,
  updateCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseHistory,
};
