import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import settingService = require('../setting/setting.service');

/**
 * Fetches all effective promotion prices for a list of product IDs at a given date.
 * Returns a Map where key is productId and value is the lowest promo price.
 */
const getBulkEffectivePromoPrices = async (tx, productIds, date = new Date()) => {
  if (!productIds.length) return new Map();

  const activePromos = await tx.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
      items: { some: { productId: { in: productIds } } },
    },
    include: {
      items: {
        where: { productId: { in: productIds } },
      },
    },
  });

  const priceMap = new Map();

  activePromos.forEach((promo) => {
    promo.items.forEach((item) => {
      const currentLowest = priceMap.get(item.productId) || Infinity;
      if (item.promoPrice < currentLowest) {
        priceMap.set(item.productId, item.promoPrice);
      }
    });
  });

  return priceMap;
};

const processSale = async ({ items, discount = 0, extraDiscount = 0, paymentMethod = 'Cash', customerId = null }) => {
  const receiptSettings = (await settingService.getSettingByKey('posReceiptSettings')) || {};

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let totalAmount = 0;
    const saleItemsData = [];
    const movementData = [];

    // 1. Fetch all batches and products in one go to validate and get basic info
    const batchIds = items.map((i) => i.batch_id);
    const batches = await tx.batch.findMany({
      where: { id: { in: batchIds } },
      include: { product: true },
    });

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const productIds = [...new Set(batches.map((b) => b.productId))];

    // 2. Fetch all promotions in one go for all unique product IDs
    const promoMap = await getBulkEffectivePromoPrices(tx, productIds);

    for (const item of items) {
      const batch = batchMap.get(item.batch_id);

      if (!batch) {
        const message = `Batch ID ${item.batch_id} not found.`;
        throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
      }

      if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
        const productName = batch.product?.name || 'Unknown Product';
        const expiredOn = new Date(batch.expiryDate).toLocaleDateString();
        const message = `Cannot sell "${productName}" — batch ${batch.batchCode || batch.id} expired on ${expiredOn}. Remove it from the cart.`;
        throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
      }

      if (batch.quantity < item.quantity) {
        const productName = batch.product?.name || 'Unknown Product';
        const message = `Insufficient stock for ${productName} (Batch ID ${item.batch_id}). Available: ${batch.quantity}, Required: ${item.quantity}.`;
        throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
      }

      // Update stock
      await tx.batch.update({
        where: { id: item.batch_id },
        data: { quantity: { decrement: item.quantity } },
      });

      // Promotion Lookup from bulk map
      const promoPrice = promoMap.get(batch.productId) || null;

      // Determine effective price
      let effectivePrice = batch.sellingPrice;
      let isWholesaleItem = false;

      // 0. Check if explicitly free (price is 0 or marked isFree)
      if (item.sellingPrice === 0 || item.isFree) {
        effectivePrice = 0;
      } else {
        isWholesaleItem = !!(
          batch.wholesaleEnabled &&
          batch.wholesaleMinQty &&
          item.quantity >= batch.wholesaleMinQty
        );

        // 1. Check Wholesale (highest priority if applicable)
        if (isWholesaleItem) {
          effectivePrice = batch.wholesalePrice;
        }
        // 2. Check Promotion
        else if (promoPrice !== null && promoPrice < batch.sellingPrice) {
          effectivePrice = promoPrice;
        }
      }

      totalAmount += effectivePrice * item.quantity;

      saleItemsData.push({
        batchId: item.batch_id,
        quantity: item.quantity,
        sellingPrice: effectivePrice,
        costPrice: batch.costPrice,
        mrp: batch.mrp,
        isWholesale: isWholesaleItem,
        isFree: !!(item.sellingPrice === 0 || item.isFree),
      });

      movementData.push({
        productId: batch.productId,
        batchId: batch.id,
        type: 'sold',
        quantity: item.quantity,
        note: 'Sale',
      });
    }

    // Guard against a discount larger than the cart. Without this the total is
    // silently clamped to 0 below, recording a zero-value sale that still
    // decrements stock — indistinguishable from a legitimate free sale.
    // Epsilon tolerance keeps an exact 100% discount valid despite float drift
    // in the accumulated totalAmount.
    const totalDiscount = discount + extraDiscount;
    if (totalDiscount > totalAmount + 0.001) {
      const message =
        `Discount (${totalDiscount.toFixed(2)}) cannot exceed the cart total ` +
        `(${totalAmount.toFixed(2)}).`;
      throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
    }

    const finalAmountBeforeRounding = totalAmount - discount - extraDiscount;
    const finalAmount = receiptSettings.roundOff
      ? Math.round(finalAmountBeforeRounding)
      : finalAmountBeforeRounding;

    const sale = await tx.sale.create({
      data: {
        totalAmount: Math.max(0, finalAmount),
        discount: discount,
        extraDiscount: extraDiscount,
        paymentMethod: paymentMethod,
        customerId: customerId || null,
        items: {
          create: saleItemsData,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            batch: {
              select: {
                id: true,
                batchCode: true,
                expiryDate: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    barcode: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (movementData.length > 0) {
      await tx.stockMovement.createMany({ data: movementData });
    }

    // 4. Update Customer Metrics if customerId is present
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalSpend: { increment: Math.max(0, finalAmount) },
          lastVisit: new Date(),
        }
      });
    }

    return sale;
  });
};

const getSaleById = async (id) => {
  return await prisma.sale.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: {
        include: {
          batch: {
            select: {
              id: true,
              batchCode: true,
              expiryDate: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const processReturn = async (saleId, returnItems) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let totalRefundAmount = 0;
    
    const sale = await tx.sale.findUnique({
      where: { id: parseInt(saleId) },
      select: { customerId: true }
    });

    if (!sale) {
      const message = `Sale ${saleId} not found`;
      throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
    }

    for (const item of returnItems) {
      const saleItem = await tx.saleItem.findUnique({
        where: { id: item.saleItemId },
      });

      if (!saleItem) {
        const message = `Sale item ${item.saleItemId} not found`;
        throw createHttpError(StatusCodes.NOT_FOUND, message, { error: message });
      }

      const remainingQty = saleItem.quantity - saleItem.returnedQuantity;
      if (item.quantity > remainingQty) {
        const message = `Cannot return more than sold quantity for item ${saleItem.id}`;
        throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
      }

      // Calculate refund for this item (based on historical selling price)
      totalRefundAmount += item.quantity * saleItem.sellingPrice;

      // Update SaleItem
      await tx.saleItem.update({
        where: { id: item.saleItemId },
        data: { returnedQuantity: saleItem.returnedQuantity + item.quantity },
      });

      // Update Batch stock
      await tx.batch.update({
        where: { id: saleItem.batchId },
        data: { quantity: { increment: item.quantity } },
      });

      const batch = await tx.batch.findUnique({
        where: { id: saleItem.batchId },
      });

      if (batch) {
        await tx.stockMovement.create({
          data: {
            productId: batch.productId,
            batchId: batch.id,
            type: 'returned',
            quantity: item.quantity,
            note: 'Return',
          },
        });
      }
    }

    // Update Customer Metrics if sale has a customer
    if (sale?.customerId && totalRefundAmount > 0) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          totalSpend: { decrement: totalRefundAmount },
        }
      });
    }

    return { message: 'Return processed successfully', totalRefunded: totalRefundAmount };
  });
};


export {
  processSale,
  getSaleById,
  processReturn,
};
