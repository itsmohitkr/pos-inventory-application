import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import settingService = require('../setting/setting.service');
import type { ProcessSaleInput } from './sale.validation';

/**
 * Fetches all effective promotion prices for a list of product IDs at a given date.
 * Returns a Map where key is productId and value is the lowest promo price.
 */
const getBulkEffectivePromoPrices = async (
  tx: Prisma.TransactionClient,
  productIds: number[],
  date = new Date()
): Promise<Map<number, number>> => {
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

  const priceMap = new Map<number, number>();

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

/**
 * The batch/product projection attached to every returned sale item.
 *
 * Extracted because processSale and getSaleById used byte-identical copies.
 * `satisfies` keeps it checked against the schema while preserving the literal
 * type, so Prisma.SaleGetPayload below derives the exact runtime shape rather
 * than a hand-written duplicate that could drift from the query.
 */
const saleItemsInclude = {
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
} satisfies Prisma.SaleInclude['items'];

/** Sale as returned by processSale — includes the linked customer. */
export type SaleWithCustomer = Prisma.SaleGetPayload<{
  include: { customer: true; items: typeof saleItemsInclude };
}>;

/** Sale as returned by getSaleById — no customer relation. */
export type SaleWithItems = Prisma.SaleGetPayload<{
  include: { items: typeof saleItemsInclude };
}>;

const processSale = async ({
  items,
  discount = 0,
  extraDiscount = 0,
  paymentMethod = 'Cash',
  customerId = null,
}: ProcessSaleInput) => {
  // Only roundOff is read here. The full shape lives in
  // server/src/config/constants.ts -> DEFAULT_RECEIPT_SETTINGS; declaring just
  // what this function uses avoids a third copy of those ~34 fields.
  const receiptSettings =
    (await settingService.getSettingByKey<{ roundOff?: boolean }>('posReceiptSettings')) ?? {};

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let totalAmount = 0;
    const saleItemsData: {
      batchId: number;
      quantity: number;
      sellingPrice: number;
      costPrice: number;
      mrp: number;
      isWholesale: boolean;
      isFree: boolean;
    }[] = [];
    const movementData: {
      productId: number;
      batchId: number;
      type: string;
      quantity: number;
      note: string;
    }[] = [];

    // 1. Fetch all batches and products in one go to validate and get basic info
    // batch_id is typed string | number by the schema, but every downstream
    // use (Prisma lookup, batchMap key, SaleItem.batchId) needs the number.
    // Normalising here means a non-numeric id reaches the "not found" 400
    // below instead of failing inside Prisma as a 500.
    const batchIds = items.map((i) => Number(i.batch_id));
    const batches = await tx.batch.findMany({
      where: { id: { in: batchIds } },
      include: { product: true },
    });

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const productIds = [...new Set(batches.map((b) => b.productId))];

    // 2. Fetch all promotions in one go for all unique product IDs
    const promoMap = await getBulkEffectivePromoPrices(tx, productIds);

    for (const item of items) {
      const batchId = Number(item.batch_id);
      const batch = batchMap.get(batchId);

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
        where: { id: batchId },
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
        // wholesalePrice can be null even when wholesaleEnabled is true and a
        // minimum quantity is set — product.service's validatePricing only
        // checks it when explicitly provided on write. Requiring it here too
        // means a batch with that data gap is priced (and reported, via the
        // isWholesale flag below) as a normal sale instead of writing NaN
        // into totalAmount.
        isWholesaleItem = !!(
          batch.wholesaleEnabled &&
          batch.wholesaleMinQty &&
          batch.wholesalePrice !== null &&
          item.quantity >= batch.wholesaleMinQty
        );

        // 1. Check Wholesale (highest priority if applicable)
        if (isWholesaleItem) {
          effectivePrice = batch.wholesalePrice as number;
        }
        // 2. Check Promotion
        else if (promoPrice !== null && promoPrice < batch.sellingPrice) {
          effectivePrice = promoPrice;
        }
      }

      totalAmount += effectivePrice * item.quantity;

      saleItemsData.push({
        batchId,
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
        // `paymentMethod = 'Cash'` above only catches `undefined` — a client
        // explicitly sending `null` reached Prisma as null for a non-nullable
        // column with a default. Coalescing here catches that case too.
        paymentMethod: paymentMethod || 'Cash',
        customerId: customerId || null,
        items: {
          create: saleItemsData,
        },
      },
      include: {
        customer: true,
        items: saleItemsInclude,
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

const getSaleById = async (id: number | string): Promise<SaleWithItems> => {
  const sale = await prisma.sale.findUnique({
    where: { id: parseInt(String(id)) },
    include: {
      items: saleItemsInclude,
    },
  });

  if (!sale) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Sale not found', { error: 'Sale not found' });
  }

  return sale;
};

interface ReturnItemInput {
  saleItemId: number;
  quantity: number;
}

interface ReturnResult {
  message: string;
  totalRefunded: number;
}

const processReturn = async (
  saleId: number | string,
  returnItems: ReturnItemInput[]
): Promise<ReturnResult> => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let totalRefundAmount = 0;
    
    const sale = await tx.sale.findUnique({
      where: { id: parseInt(String(saleId)) },
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
  saleItemsInclude,
};
