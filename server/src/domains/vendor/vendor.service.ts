import prisma = require('../../config/prisma');
import { createHttpError } from '../../shared/error/appError';
import { computePurchaseFinancials } from '../purchase/purchaseFinancials';
import type { FindOrCreateVendorInput, UpdateVendorInput } from './vendor.validation';

/** Per-vendor money totals, derived the same way purchase.service.ts derives
 * them for a single purchase — see purchaseFinancials.ts for why this is one
 * shared computation rather than two that could drift apart. */
const getVendorTotals = async (vendorId: number) => {
  const purchases = await prisma.purchase.findMany({
    where: { vendorId },
    include: { payments: true },
  });

  return purchases.reduce(
    (totals, purchase) => {
      const { dueAmount } = computePurchaseFinancials(purchase);
      return {
        totalPurchased: totals.totalPurchased + purchase.totalAmount,
        totalDue: totals.totalDue + dueAmount,
        purchaseCount: totals.purchaseCount + 1,
        lastPurchaseDate:
          !totals.lastPurchaseDate || purchase.date > totals.lastPurchaseDate
            ? purchase.date
            : totals.lastPurchaseDate,
      };
    },
    {
      totalPurchased: 0,
      totalDue: 0,
      purchaseCount: 0,
      lastPurchaseDate: null as Date | null,
    }
  );
};

const findOrCreateVendor = async ({ name, phone, address }: FindOrCreateVendorInput) => {
  const trimmedName = name.trim();
  const existing = await prisma.vendor.findUnique({ where: { name: trimmedName } });
  if (existing) {
    return { vendor: existing, isNew: false };
  }

  const vendor = await prisma.vendor.create({
    data: { name: trimmedName, phone: phone || null, address: address || null },
  });
  return { vendor, isNew: true };
};

const getAllVendors = async ({
  page = 1,
  limit = 50,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const skip = (page - 1) * limit;
  const where = search ? { name: { contains: search } } : {};

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.count({ where }),
  ]);

  const vendorsWithTotals = await Promise.all(
    vendors.map(async (vendor) => ({
      ...vendor,
      ...(await getVendorTotals(vendor.id)),
    }))
  );

  return { vendors: vendorsWithTotals, total, page, limit };
};

const getVendorById = async (id: number) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw createHttpError(404, 'Vendor not found');

  const purchases = await prisma.purchase.findMany({
    where: { vendorId: id },
    include: { items: true, payments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { date: 'desc' },
  });

  const purchasesWithFinancials = purchases.map((purchase) => ({
    ...purchase,
    ...computePurchaseFinancials(purchase),
  }));

  const totals = await getVendorTotals(id);

  return { vendor, purchases: purchasesWithFinancials, ...totals };
};

const updateVendor = async (id: number, data: UpdateVendorInput) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw createHttpError(404, 'Vendor not found');

  if (data.name && data.name.trim() !== vendor.name) {
    const existing = await prisma.vendor.findUnique({ where: { name: data.name.trim() } });
    if (existing) throw createHttpError(409, 'A vendor with this name already exists');
  }

  return prisma.vendor.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
    },
  });
};

export { findOrCreateVendor, getAllVendors, getVendorById, updateVendor };
