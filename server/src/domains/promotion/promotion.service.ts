import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import { toId } from '../../shared/utils/idUtils';
import type { PromotionInput } from './promotion.validation';

/**
 * Create a new promotion with items
 */
const createPromotion = async ({ name, startDate, endDate, items, isActive = true }: PromotionInput) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create the promotion
    const promotion = await tx.promotion.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        items: {
          create: items.map((item) => ({
            productId: toId(item.productId),
            promoPrice: item.promoPrice,
            discountPercentage: item.discountPercentage,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    return promotion;
  });
};

/**
 * Get all promotions
 */
const getAllPromotions = async () => {
  return await prisma.promotion.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Get active promotions for a product
 */
const getActivePromotionsForProduct = async (productId: string | number, date = new Date()) => {
  return await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
      items: {
        some: {
          productId: toId(productId),
        },
      },
    },
    include: {
      items: {
        where: {
          productId: toId(productId),
        },
      },
    },
  });
};

/**
 * Find the best active promotional price for a product
 */
const getEffectivePromoPrice = async (productId: string | number) => {
  const activePromos = await getActivePromotionsForProduct(productId);

  if (activePromos.length === 0) return null;

  // If multiple overlapping, pick the lowest price
  let lowestPrice = Infinity;
  activePromos.forEach((promo) => {
    promo.items.forEach((item) => {
      if (item.promoPrice < lowestPrice) {
        lowestPrice = item.promoPrice;
      }
    });
  });

  return lowestPrice === Infinity ? null : lowestPrice;
};

/**
 * Get product details and its current batch pricing
 * Used to help the UI show MRP/CP/SP while setting up a promotion
 */
const getProductPricingOptions = async (productId: string | number) => {
  const product = await prisma.product.findUnique({
    where: { id: toId(productId) },
    include: {
      batches: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!product) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

  // Optional chaining rather than a `|| {}` fallback: the empty object
  // erased the Batch type. Runtime behaviour is identical — the `|| 0`
  // defaults below already handled a missing batch.
  const latestBatch = product.batches[0];
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    mrp: latestBatch?.mrp || 0,
    costPrice: latestBatch?.costPrice || 0,
    sellingPrice: latestBatch?.sellingPrice || 0,
  };
};

/**
 * Delete a promotion
 */
const deletePromotion = async (id: string | number) => {
  return await prisma.promotion.delete({
    where: { id: toId(id) },
  });
};

/**
 * Update an existing promotion
 */
const updatePromotion = async (id: string | number, { name, startDate, endDate, items, isActive = true }: PromotionInput) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Delete all existing items for this promotion
    await tx.promotionItem.deleteMany({
      where: { promotionId: toId(id) },
    });

    // Update the promotion and add the new items
    const promotion = await tx.promotion.update({
      where: { id: toId(id) },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        items: {
          create: items.map((item) => ({
            productId: toId(item.productId),
            promoPrice: item.promoPrice,
            discountPercentage: item.discountPercentage,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    return promotion;
  });
};

export {
  createPromotion,
  getAllPromotions,
  getActivePromotionsForProduct,
  getEffectivePromoPrice,
  getProductPricingOptions,
  deletePromotion,
  updatePromotion,
};
