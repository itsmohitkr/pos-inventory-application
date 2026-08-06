import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import { toId } from '../../shared/utils/idUtils';
import type { CategorySaleInput } from './category-sale.validation';

export type CategorySaleComputedStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';

export interface ProductOverride {
  productId: number;
  discountPercentage: number;
  reason: string;
}

export interface CategorySaleWithComputedStatus {
  id: number;
  name: string;
  category: string;
  discountPercentage: number;
  isIndefinite: boolean;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  excludedProductIds: number[];
  productOverrides: ProductOverride[];
  computedStatus: CategorySaleComputedStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveCategorySaleInfo {
  discountPercentage: number;
  excludedProductIds: Set<number>;
  productOverrides: Map<number, { discountPercentage: number; reason: string }>;
}

export interface CategorySaleDiscountResult {
  /** MRP-based discount price after the cost floor — not yet compared to the current regular price. */
  price: number;
  /** True if the naive MRP-based discount would have gone below cost before flooring. */
  marginProtected: boolean;
}

/**
 * The one piece of math shared by both the checkout-time price
 * (sale.service.ts's getCategorySalePrice) and the merchant-facing preview
 * (previewCategorySaleProducts below): a flat category discount off MRP,
 * capped at cost price so a category sale can never turn into a real loss.
 * Deliberately does NOT compare against the current regular selling price —
 * callers need that comparison at different points (see getCategorySalePrice's
 * own comment for why it can't happen here).
 */
export const computeCategorySaleDiscountedPrice = (
  mrp: number,
  costPrice: number,
  discountPercentage: number
): CategorySaleDiscountResult => {
  const rawPrice = Math.round(mrp * (1 - discountPercentage / 100) * 100) / 100;
  return { price: Math.max(rawPrice, costPrice), marginProtected: rawPrice < costPrice };
};

export interface ProductPreviewItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  mrp: number;
  costPrice: number;
  vendorDiscountAmount: number;
  vendorDiscountPercentage: number;
  currentSellingPrice: number;
  currentCustomerDiscountAmount: number;
  currentCustomerDiscountPercentage: number;
  regularProfitAmount: number;
  regularProfitMargin: number;
  discountPercentage: number;
  newSellingPrice: number;
  profitAmount: number;
  profitMargin: number;
  /** The naive MRP-based discount would have undercut cost; price was capped at breakeven instead. */
  marginProtected: boolean;
  /** The product's current regular price already beats what this category discount offers — no extra discount applies. */
  noAdditionalDiscount: boolean;
  /** An admin has deliberately overridden this product's discount, bypassing the automatic margin floor. */
  isOverride: boolean;
  overrideReason: string | null;
  /** No batch has ever been added for this product — mrp/costPrice/currentSellingPrice are all 0 because there's genuinely no data, not because of any pricing outcome. */
  hasPricingData: boolean;
}

/**
 * Computes the real-time runtime status of a category sale based on current time.
 */
const computeComputedStatus = (
  sale: {
    status: string;
    isIndefinite: boolean;
    startDate: Date | null;
    endDate: Date | null;
  },
  now = new Date()
): CategorySaleComputedStatus => {
  if (sale.status === 'draft') return 'draft';
  if (sale.status === 'paused') return 'paused';
  if (sale.isIndefinite) return 'active';

  if (sale.startDate && new Date(sale.startDate) > now) {
    return 'scheduled';
  }
  if (sale.endDate && new Date(sale.endDate) < now) {
    return 'expired';
  }
  return 'active';
};

const parseExcludedProductIds = (excludedProductIdsStr: string | null | undefined): number[] => {
  if (!excludedProductIdsStr) return [];
  try {
    const parsed = JSON.parse(excludedProductIdsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseProductOverrides = (productOverridesStr: string | null | undefined): ProductOverride[] => {
  if (!productOverridesStr) return [];
  try {
    const parsed = JSON.parse(productOverridesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatSaleRecord = (sale: any, now = new Date()): CategorySaleWithComputedStatus => {
  return {
    ...sale,
    productOverrides: parseProductOverrides(sale.productOverrides),
    excludedProductIds: parseExcludedProductIds(sale.excludedProductIds),
    computedStatus: computeComputedStatus(sale, now),
  };
};

/**
 * Create a new Category Sale
 */
const createCategorySale = async (input: CategorySaleInput): Promise<CategorySaleWithComputedStatus> => {
  const excludedStr = input.excludedProductIds && input.excludedProductIds.length > 0
    ? JSON.stringify(input.excludedProductIds)
    : null;
  const overridesStr = input.productOverrides && input.productOverrides.length > 0
    ? JSON.stringify(input.productOverrides)
    : null;

  const sale = await prisma.categorySale.create({
    data: {
      name: input.name,
      category: input.category,
      discountPercentage: input.discountPercentage,
      isIndefinite: input.isIndefinite,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: input.status,
      excludedProductIds: excludedStr,
      productOverrides: overridesStr,
    },
  });
  return formatSaleRecord(sale);
};

/**
 * Get all Category Sales with computed real-time status
 */
const getAllCategorySales = async (): Promise<CategorySaleWithComputedStatus[]> => {
  const sales = await prisma.categorySale.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const now = new Date();
  return sales.map((sale) => formatSaleRecord(sale, now));
};

/**
 * Get a single Category Sale by ID
 */
const getCategorySaleById = async (id: string | number): Promise<CategorySaleWithComputedStatus> => {
  const sale = await prisma.categorySale.findUnique({
    where: { id: toId(id) },
  });
  if (!sale) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Category sale not found', {
      error: 'Category sale not found',
    });
  }
  return formatSaleRecord(sale);
};

/**
 * Update an existing Category Sale
 */
const updateCategorySale = async (
  id: string | number,
  input: CategorySaleInput
): Promise<CategorySaleWithComputedStatus> => {
  const existing = await prisma.categorySale.findUnique({ where: { id: toId(id) } });
  if (!existing) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Category sale not found', {
      error: 'Category sale not found',
    });
  }

  const excludedStr = input.excludedProductIds && input.excludedProductIds.length > 0
    ? JSON.stringify(input.excludedProductIds)
    : null;
  const overridesStr = input.productOverrides && input.productOverrides.length > 0
    ? JSON.stringify(input.productOverrides)
    : null;

  const sale = await prisma.categorySale.update({
    where: { id: toId(id) },
    data: {
      name: input.name,
      category: input.category,
      discountPercentage: input.discountPercentage,
      isIndefinite: input.isIndefinite,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: input.status,
      excludedProductIds: excludedStr,
      productOverrides: overridesStr,
    },
  });
  return formatSaleRecord(sale);
};

/**
 * Toggle status of Category Sale ('draft', 'active', 'paused')
 */
const toggleCategorySaleStatus = async (
  id: string | number,
  status: 'draft' | 'active' | 'paused'
): Promise<CategorySaleWithComputedStatus> => {
  const existing = await prisma.categorySale.findUnique({ where: { id: toId(id) } });
  if (!existing) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Category sale not found', {
      error: 'Category sale not found',
    });
  }

  const sale = await prisma.categorySale.update({
    where: { id: toId(id) },
    data: { status },
  });
  return formatSaleRecord(sale);
};

/**
 * Delete a Category Sale
 */
const deleteCategorySale = async (id: string | number) => {
  const existing = await prisma.categorySale.findUnique({ where: { id: toId(id) } });
  if (!existing) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Category sale not found', {
      error: 'Category sale not found',
    });
  }

  return await prisma.categorySale.delete({
    where: { id: toId(id) },
  });
};

/**
 * Generate product preview showing affected products and calculated pricing/margins
 */
const previewCategorySaleProducts = async (
  category: string,
  discountPercentage: number,
  productOverrides: ProductOverride[] = []
): Promise<ProductPreviewItem[]> => {
  const overrideMap = new Map(productOverrides.map((o) => [o.productId, o]));
  // Matched in JS (not via a DB-level `equals` filter) so this uses the exact
  // same case/whitespace-insensitive comparison as getActiveCategorySalesMap
  // and getCategorySalePrice in sale.service.ts. An exact-match filter here
  // previously meant a product could be silently absent from this preview —
  // so never reviewed or excluded by the merchant — while still being
  // discounted for real at checkout, because the live code paths match more
  // loosely than this one did.
  const catKey = category.toLowerCase().trim();
  const allProducts = await prisma.product.findMany({
    where: { isDeleted: false },
    include: {
      batches: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  const products = allProducts.filter((product) => product.category?.toLowerCase().trim() === catKey);

  return products.map((product) => {
    const latestBatch = product.batches[0];
    const hasPricingData = !!latestBatch;
    const mrp = latestBatch?.mrp ?? latestBatch?.sellingPrice ?? 0;
    const costPrice = latestBatch?.costPrice ?? 0;
    const currentSellingPrice = latestBatch?.sellingPrice ?? 0;

    // Vendor discount (difference between MRP and Cost Price)
    const vendorDiscountAmount = Math.max(0, Math.round((mrp - costPrice) * 100) / 100);
    const vendorDiscountPercentage =
      mrp > 0 ? Math.round(((mrp - costPrice) / mrp) * 1000) / 10 : 0;

    // Current Customer discount (difference between MRP and regular Selling Price)
    const currentCustomerDiscountAmount = Math.max(0, Math.round((mrp - currentSellingPrice) * 100) / 100);
    const currentCustomerDiscountPercentage =
      mrp > 0 ? Math.round(((mrp - currentSellingPrice) / mrp) * 1000) / 10 : 0;

    // Regular Profit & Margin (without category sale)
    const regularProfitAmount = Math.round((currentSellingPrice - costPrice) * 100) / 100;
    const regularProfitMargin =
      currentSellingPrice > 0
        ? Math.round(((currentSellingPrice - costPrice) / currentSellingPrice) * 1000) / 10
        : 0;

    // Proposed Category Sale Pricing & Profit (Discount percentage applied on
    // MRP and floored at cost via the same computeCategorySaleDiscountedPrice
    // sale.service.ts's getCategorySalePrice uses at checkout, then compared
    // here against the current regular price — see that function's own
    // comment for why that comparison can't live inside the shared helper —
    // so this preview shows the price the customer will actually be charged,
    // not a number that looks valid here but silently never applies).
    const basePrice = mrp > 0 ? mrp : currentSellingPrice;
    const override = overrideMap.get(product.id);

    let newSellingPrice: number;
    let marginProtected: boolean;
    let noAdditionalDiscount: boolean;
    let isOverride: boolean;
    let overrideReason: string | null;

    if (!hasPricingData) {
      // No batch has ever been added for this product — there is no MRP,
      // cost, or selling price to discount at all. Previously this fell
      // through to the normal branch, where mrp/costPrice/currentSellingPrice
      // are all 0, and `0 >= 0` made noAdditionalDiscount true — mislabeling
      // "no data yet" as "already has a better regular price", which is
      // false and confusing (every other column showing 0 alongside a
      // "better deal" claim). This is a distinct case, not a pricing outcome.
      newSellingPrice = 0;
      marginProtected = false;
      noAdditionalDiscount = false;
      isOverride = false;
      overrideReason = null;
    } else if (override) {
      // Deliberate admin choice — computed directly off MRP, no margin
      // floor, no comparison to the current price. See sale.service.ts's
      // getCategorySalePrice for the matching checkout-time logic.
      newSellingPrice = Math.round(basePrice * (1 - override.discountPercentage / 100) * 100) / 100;
      marginProtected = false;
      noAdditionalDiscount = false;
      isOverride = true;
      overrideReason = override.reason;
    } else {
      const { price: marginFlooredPrice, marginProtected: floored } = computeCategorySaleDiscountedPrice(
        basePrice,
        costPrice,
        discountPercentage
      );
      // Never worse than what the customer already pays regularly.
      newSellingPrice = Math.min(marginFlooredPrice, currentSellingPrice);
      marginProtected = floored;
      noAdditionalDiscount = marginFlooredPrice >= currentSellingPrice;
      isOverride = false;
      overrideReason = null;
    }

    const profitAmount = Math.round((newSellingPrice - costPrice) * 100) / 100;
    const profitMargin =
      newSellingPrice > 0
        ? Math.round(((newSellingPrice - costPrice) / newSellingPrice) * 1000) / 10
        : 0;

    return {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      mrp,
      costPrice,
      vendorDiscountAmount,
      vendorDiscountPercentage,
      currentSellingPrice,
      currentCustomerDiscountAmount,
      currentCustomerDiscountPercentage,
      regularProfitAmount,
      regularProfitMargin,
      discountPercentage,
      newSellingPrice,
      profitAmount,
      profitMargin,
      marginProtected,
      noAdditionalDiscount,
      isOverride,
      overrideReason,
      hasPricingData,
    };
  });
};

/**
 * Fetch all currently active category sales as a Map of normalized category -> ActiveCategorySaleInfo.
 * If multiple sales apply to the same category, the highest discount percentage is returned.
 */
const getActiveCategorySalesMap = async (
  tx: Prisma.TransactionClient = prisma,
  date = new Date()
): Promise<Map<string, ActiveCategorySaleInfo>> => {
  const activeSales = await tx.categorySale.findMany({
    where: {
      status: 'active',
      OR: [
        { isIndefinite: true },
        {
          AND: [{ startDate: { lte: date } }, { endDate: { gte: date } }],
        },
      ],
    },
  });

  const categoryDiscountMap = new Map<string, ActiveCategorySaleInfo>();

  activeSales.forEach((sale) => {
    const catKey = sale.category.toLowerCase().trim();
    const excludedSet = new Set<number>(parseExcludedProductIds(sale.excludedProductIds));
    const overridesMap = new Map(
      parseProductOverrides(sale.productOverrides).map((o) => [
        o.productId,
        { discountPercentage: o.discountPercentage, reason: o.reason },
      ])
    );
    const existing = categoryDiscountMap.get(catKey);

    if (!existing || sale.discountPercentage > existing.discountPercentage) {
      categoryDiscountMap.set(catKey, {
        discountPercentage: sale.discountPercentage,
        excludedProductIds: excludedSet,
        productOverrides: overridesMap,
      });
    }
  });

  return categoryDiscountMap;
};

export {
  createCategorySale,
  getAllCategorySales,
  getCategorySaleById,
  updateCategorySale,
  toggleCategorySaleStatus,
  deleteCategorySale,
  previewCategorySaleProducts,
  getActiveCategorySalesMap,
  computeComputedStatus,
};
