const prisma = require('../../config/prisma');

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

const processSale = async ({ items, discount = 0, extraDiscount = 0, paymentMethod = 'Cash' }) => {
  return await prisma.$transaction(async (tx) => {
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
        throw new Error(`Batch ID ${item.batch_id} not found.`);
      }

      if (batch.quantity < item.quantity) {
        const productName = batch.product?.name || 'Unknown Product';
        throw new Error(
          `Insufficient stock for ${productName} (Batch ID ${item.batch_id}). Available: ${batch.quantity}, Required: ${item.quantity}.`
        );
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

    const settingService = require('../setting/setting.service');
    const receiptSettings = (await settingService.getSettingByKey('posReceiptSettings')) || {};

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
        items: {
          create: saleItemsData,
        },
      },
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

    if (movementData.length > 0) {
      await tx.stockMovement.createMany({ data: movementData });
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
  return await prisma.$transaction(async (tx) => {
    for (const item of returnItems) {
      const saleItem = await tx.saleItem.findUnique({
        where: { id: item.saleItemId },
      });

      if (!saleItem) throw new Error(`Sale item ${item.saleItemId} not found`);

      const remainingQty = saleItem.quantity - saleItem.returnedQuantity;
      if (item.quantity > remainingQty) {
        throw new Error(`Cannot return more than sold quantity for item ${saleItem.id}`);
      }

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
    return { message: 'Return processed successfully' };
  });
};

module.exports = {
  processSale,
  getSaleById,
  processReturn,
};
