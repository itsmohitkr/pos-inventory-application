import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import { getDateWithCurrentTime, dateRangeWhere } from '../../shared/utils/dateUtils';
import { derivePaymentStatus } from '../../shared/utils/paymentStatus';
import { toId } from '../../shared/utils/idUtils';
import type {
  CreatePurchaseInput,
  PurchasePaymentInput,
  UpdatePurchaseInput,
} from './purchase.validation';


/** Purchase with the relations every read in this service includes. */
type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: { items: true; payments: true };
}>;

/** Purchase read with payments only — used by the payment-status recalculation. */
type PurchaseWithPayments = Prisma.PurchaseGetPayload<{ include: { payments: true } }>;

/** Query filters accepted by getPurchases; all optional. */
interface PurchaseFilters {
  startDate?: string;
  endDate?: string;
  vendor?: string;
}

const createPurchase = async (data: CreatePurchaseInput) => {
  const { vendor, totalAmount, date, note, paidAmount, paymentMethod, items = [] } = data;

  // Filter out invalid items (those without product IDs)
  const validItems = items.filter((item) => item.productId && !isNaN(toId(item.productId)));

  // Both are already numbers — the schema coerces them.
  const parsedTotalAmount = totalAmount || 0;
  const parsedPaidAmount = paidAmount || 0;

  const initialPaymentStatus = derivePaymentStatus(parsedTotalAmount, parsedPaidAmount);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Assembled from form values, then cast to Prisma's input at the call
    // site below — the shapes differ (strings vs numbers/dates).
    const purchaseData: Record<string, unknown> = {
      vendor,
      totalAmount: parsedTotalAmount,
      date: date ? getDateWithCurrentTime(date) : new Date(),
      note,
      paymentStatus: initialPaymentStatus,
      paymentMethod: paymentMethod || 'Cash',
    };

    if (validItems.length > 0) {
      purchaseData.items = {
        create: validItems.map((item) => ({
          productId: toId(item.productId),
          batchId: item.batchId ? toId(item.batchId) : null,
          quantity: item.quantity || 0,
          costPrice: item.costPrice || 0,
        })),
      };
    }

    const purchase: PurchaseWithRelations = await tx.purchase.create({
      data: purchaseData as Prisma.PurchaseCreateInput,
      include: { items: true, payments: true },
    });

    // Record the initial payment if an amount was given
    if (parsedPaidAmount > 0) {
      // `create` returns the persisted row, so the response carries the real
      // id/createdAt instead of a hand-built stand-in that had to be cast
      // through `unknown` to pass as a PurchasePayment.
      const initialPayment = await tx.purchasePayment.create({
        data: {
          purchaseId: purchase.id,
          amount: parsedPaidAmount,
          paymentMethod: paymentMethod || 'Cash',
          date: purchase.date,
          note: 'Initial payment upon logging purchase',
        },
      });
      purchase.payments = [initialPayment];
    }

    // Optionally update batch cost price if batchId is provided
    for (const item of validItems) {
      if (item.batchId) {
        await tx.batch.update({
          where: { id: toId(item.batchId) },
          data: { costPrice: item.costPrice || 0 },
        });
      }
    }

    return {
      ...purchase,
      paymentMethod: purchase.paymentMethod || 'Cash',
    };
  });
};

const getPurchases = async (filters: PurchaseFilters = {}) => {
  const { startDate, endDate, vendor } = filters;

  const where: Prisma.PurchaseWhereInput = {};
  const dateRange = dateRangeWhere(startDate, endDate);
  if (dateRange) where.date = dateRange;
  if (vendor) {
    where.vendor = { contains: vendor };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { items: true, payments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { date: 'desc' },
  });

  // Compute due amount and correct status dynamically based on payments
  return purchases.map((p) => {
    const totalPaid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const dueAmount = Math.max(0, p.totalAmount - totalPaid);
    const currentStatus = derivePaymentStatus(p.totalAmount, totalPaid);

    return {
      ...p,
      totalPaid,
      dueAmount,
      paymentStatus: currentStatus,
      paymentMethod: p.paymentMethod || 'Cash',
    };
  });
};

const deletePurchase = async (id: number) => {
  return await prisma.purchase.delete({
    where: { id },
  });
};

const updatePurchase = async (id: number, data: UpdatePurchaseInput) => {
  const { vendor, totalAmount, date, note, paymentStatus, items = [] } = data;

  // Filter out invalid items (those without product IDs)
  const validItems = items.filter((item) => item.productId && !isNaN(toId(item.productId)));

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Assembled from form values, then cast to Prisma's input at the call
    // site below — the shapes differ (strings vs numbers/dates).
    const purchaseData: Record<string, unknown> = {
      vendor,
      totalAmount: totalAmount || 0,
      date: date ? new Date(date) : new Date(),
      note,
      paymentStatus: paymentStatus || 'Paid',
      paymentMethod: data.paymentMethod || 'Cash',
    };

    // If items are provided, delete old ones and create new ones
    if (validItems.length > 0) {
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      purchaseData.items = {
        create: validItems.map((item) => ({
          productId: toId(item.productId),
          batchId: item.batchId ? toId(item.batchId) : null,
          quantity: item.quantity || 0,
          costPrice: item.costPrice || 0,
        })),
      };
    }

    const purchase: PurchaseWithRelations = await tx.purchase.update({
      where: { id },
      data: purchaseData,
      include: { items: true, payments: { orderBy: { createdAt: 'asc' } } },
    });

    // Optionally update batch cost price if batchId is provided
    for (const item of validItems) {
      if (item.batchId) {
        await tx.batch.update({
          where: { id: toId(item.batchId) },
          data: { costPrice: item.costPrice || 0 },
        });
      }
    }

    return {
      ...purchase,
      paymentMethod: purchase.payments.length > 0 ? purchase.payments[0].paymentMethod : 'Cash',
    };
  });
};

const updatePayment = async (paymentId: number, paymentData: PurchasePaymentInput) => {
  const { amount, date, note, paymentMethod } = paymentData;
  const pid = paymentId;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const oldPayment = await tx.purchasePayment.findUnique({
      where: { id: pid },
    });

    if (!oldPayment) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Payment not found', {
        error: 'Payment not found',
      });
    }

    const payment = await tx.purchasePayment.update({
      where: { id: pid },
      data: {
        amount,
        paymentMethod,
        date: date ? getDateWithCurrentTime(date) : undefined,
        note,
      },
    });

    // Update parent purchase status
    await syncPurchaseStatus(payment.purchaseId, tx);

    return payment;
  });
};

const deletePayment = async (paymentId: number) => {
  const pid = paymentId;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.purchasePayment.findUnique({
      where: { id: pid },
    });

    if (!payment) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Payment not found', {
        error: 'Payment not found',
      });
    }

    await tx.purchasePayment.delete({
      where: { id: pid },
    });

    // Update parent purchase status
    await syncPurchaseStatus(payment.purchaseId, tx);

    return { success: true };
  });
};

// Internal helper to sync purchase status after payment changes
const syncPurchaseStatus = async (purchaseId: number, tx: Prisma.TransactionClient) => {
  const purchase: PurchaseWithPayments | null = await tx.purchase.findUnique({
    where: { id: purchaseId },
    include: { payments: true },
  });

  // The purchase this payment belongs to was already validated by the caller
  // in the same transaction; a missing row here means it was deleted mid-flight.
  if (!purchase) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Purchase not found', {
      error: 'Purchase not found',
    });
  }

  const totalPaid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
  const newStatus = derivePaymentStatus(purchase.totalAmount, totalPaid);

  await tx.purchase.update({
    where: { id: purchase.id },
    data: { paymentStatus: newStatus },
  });
};

const addPayment = async (purchaseId: number, paymentData: PurchasePaymentInput) => {
  const { amount, date, note, paymentMethod } = paymentData;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.purchasePayment.create({
      data: {
        purchaseId,
        amount: amount || 0,
        paymentMethod: paymentMethod || 'Cash',
        date: date ? getDateWithCurrentTime(date) : new Date(),
        note,
      },
    });

    // Check if fully paid to update the parent status
    const purchase: PurchaseWithPayments | null = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { payments: true },
    });

    if (!purchase) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Purchase not found', {
        error: 'Purchase not found',
      });
    }

    // NOTE: intentionally not derivePaymentStatus/syncPurchaseStatus — unlike
    // those, this never resolves to 'Unpaid' (a $0 payment on an unpaid
    // purchase lands here as 'Due', not 'Unpaid'). Pre-existing behavior,
    // left as-is rather than silently changed by a DRY pass.
    const totalPaid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= purchase.totalAmount) {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { paymentStatus: 'Paid' },
      });
    } else {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { paymentStatus: 'Due' },
      });
    }

    return payment;
  });
};

export {
  createPurchase,
  getPurchases,
  deletePurchase,
  updatePurchase,
  addPayment,
  updatePayment,
  deletePayment,
};
