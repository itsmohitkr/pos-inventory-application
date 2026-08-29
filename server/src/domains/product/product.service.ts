import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Batch, Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import { getDateRange } from '../../shared/utils/dateUtils';
import { getErrorMessage } from '../../shared/utils/errorMessage';
import categoryService = require('../category/category.service');
import categorySaleService = require('../category-sale/category-sale.service');
import logger = require('../../shared/utils/logger');
import type { CreateProductInput, UpdateProductInput } from './product.validation';

const normalizeCategory = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  // Standardize slashes: trim spaces around slashes
  return trimmed
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
};

const normalizeSearch = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

/** Mirrors the OR conditions below in plain JS, so a single fetched batch
 * of candidate products can be re-checked per barcode without a second
 * query — barcode is stored as a pipe-separated string on Product. */
const _barcodeMatches = (productBarcode: string | null, singleBarcode: string): boolean => {
  if (!productBarcode) return false;
  return (
    productBarcode === singleBarcode ||
    productBarcode.startsWith(`${singleBarcode}|`) ||
    productBarcode.endsWith(`|${singleBarcode}`) ||
    productBarcode.includes(`|${singleBarcode}|`)
  );
};

const _validateBarcodesUniqueness = async (
  tx: Prisma.TransactionClient,
  barcodeStr: string | null | undefined,
  excludeProductId: number | null = null
) => {
  if (!barcodeStr || !barcodeStr.trim()) return;

  const barcodes = barcodeStr
    .split('|')
    .map((b) => b.trim())
    .filter(Boolean);
  if (barcodes.length === 0) return;

  // Single round trip for every barcode in this product instead of one
  // query per barcode (previously N sequential queries per save, and
  // #barcodes × #rows during CSV import) — fetch every product that could
  // conflict with ANY of them, then replay the same per-barcode, in-order
  // "first conflict wins" check in JS against that one result set.
  const candidates = await tx.product.findMany({
    where: {
      isDeleted: false,
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      OR: barcodes.flatMap((singleBarcode) => [
        { barcode: singleBarcode },
        { barcode: { startsWith: `${singleBarcode}|` } },
        { barcode: { endsWith: `|${singleBarcode}` } },
        { barcode: { contains: `|${singleBarcode}|` } },
      ]),
    },
    select: { name: true, barcode: true },
  });

  for (const singleBarcode of barcodes) {
    const existing = candidates.find((candidate) => _barcodeMatches(candidate.barcode, singleBarcode));
    if (existing) {
      const conflictMessage = `BARCODE_CONFLICT: Barcode '${singleBarcode}' is already associated with product '${existing.name}'`;
      throw createHttpError(StatusCodes.CONFLICT, conflictMessage, { error: conflictMessage });
    }
  }
};

const generateBatchCode = () => {
  // Generate timestamp-based batch code: B-YYYYMMDDHHMMSSmmm
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `B-${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
};

/**
 * Creates a batch and its matching 'added' stock movement inside a transaction.
 * Every stock-creating path funnels through here so the batch row and the
 * ledger entry can never diverge.
 *
 * `skipMovementWhenZero` preserves a pre-existing behavioural difference: the
 * CSV import and bulk-create paths omit the movement for zero-quantity rows,
 * while the interactive paths always record one. Passing it explicitly keeps
 * that difference deliberate rather than accidental.
 */
interface CreateBatchArgs {
  productId: number;
  batchCode?: string | null;
  quantity: number;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  expiryDate?: Date | null;
  note: string;
  /** CSV import and bulk create omit the ledger entry for zero-quantity rows. */
  skipMovementWhenZero?: boolean;
}

const createBatchWithMovement = async (
  tx: Prisma.TransactionClient,
  { productId, batchCode, quantity, mrp, costPrice, sellingPrice, wholesaleEnabled = false,
    wholesalePrice = null, wholesaleMinQty = null, expiryDate = null, note,
    skipMovementWhenZero = false }: CreateBatchArgs
) => {
  const createdBatch = await tx.batch.create({
    data: {
      productId,
      batchCode,
      quantity,
      mrp,
      costPrice,
      sellingPrice,
      wholesaleEnabled,
      wholesalePrice,
      wholesaleMinQty,
      expiryDate,
    },
  });

  if (!skipMovementWhenZero || quantity > 0) {
    await tx.stockMovement.create({
      data: { productId, batchId: createdBatch.id, type: 'added', quantity, note },
    });
  }

  return createdBatch;
};

/**
 * Accumulates quantity into an existing batch (the non-batch-tracked flow, where
 * a product keeps a single logical batch) and records the movement.
 */
const addQuantityToBatch = async (
  tx: Prisma.TransactionClient,
  { batch, qtyToAdd, note }: { batch: Batch; qtyToAdd: number; note: string }
) => {
  const newQty = batch.quantity + qtyToAdd;
  validateQuantity(newQty);

  const updatedBatch = await tx.batch.update({
    where: { id: batch.id },
    data: { quantity: newQty },
  });

  await tx.stockMovement.create({
    data: {
      productId: batch.productId,
      batchId: batch.id,
      type: 'added',
      quantity: qtyToAdd,
      note,
    },
  });

  return updatedBatch;
};

// Proper RFC 4180 CSV parser that handles quoted values with commas and special characters
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote ("")
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Column separator (only if not inside quotes)
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last column
  result.push(current.trim());
  return result;
};

const validatePricing = ({
  mrp,
  costPrice,
  sellingPrice,
  wholesalePrice,
  wholesaleEnabled,
}: {
  mrp?: number;
  costPrice?: number;
  sellingPrice?: number;
  wholesalePrice?: number | null;
  wholesaleEnabled?: boolean;
}) => {
  if (mrp === undefined || costPrice === undefined || sellingPrice === undefined) return;
  if (Number.isNaN(mrp) || Number.isNaN(costPrice) || Number.isNaN(sellingPrice)) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid pricing values', {
      error: 'Invalid pricing values',
    });
  }
  if (sellingPrice < costPrice || sellingPrice > mrp) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Selling price must be between cost price and MRP', {
      error: 'Selling price must be between cost price and MRP',
    });
  }

  // `!= null` (loose) catches both null and undefined. Using `!== undefined`
  // alone let a cleared wholesale price (null) through to the comparisons
  // below, which coerce null to 0 — silently comparing 0 against cost/selling
  // price instead of skipping validation for "no wholesale price set".
  if (wholesaleEnabled && wholesalePrice != null) {
    if (Number.isNaN(wholesalePrice)) {
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Invalid wholesale price', {
        error: 'Invalid wholesale price',
      });
    }
    if (wholesalePrice < costPrice || wholesalePrice > sellingPrice) {
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Wholesale price must be between cost price and regular selling price', {
        error: 'Wholesale price must be between cost price and regular selling price',
      });
    }
  }
};

// Escapes the `'` string delimiter. Required for every value interpolated into SQL.
const escapeSqlString = (value: string): string => value.replace(/'/g, "''");

// Escapes LIKE metacharacters so they match literally. Only valid for values used
// in a LIKE pattern — applying it to an `=` comparison corrupts the value.
const escapeSqlLike = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

/**
 * Search/category filters shared by the SQL and Prisma query builders.
 *
 * Declared as strings rather than `unknown` because `category` is
 * interpolated into raw SQL below — the escaping helpers require a string,
 * and the controller reads both through queryStrOr, so they always are one.
 */
interface ProductListFilters {
  search?: string;
  category?: string;
}

const buildWhereSql = ({ search, category }: ProductListFilters) => {
  const clauses = ["p.isDeleted = 0"];

  const normalizedSearch = normalizeSearch(search);
  if (normalizedSearch) {
    const like = `%${escapeSqlString(escapeSqlLike(normalizedSearch))}%`;
    clauses.push(`(p.name LIKE '${like}' ESCAPE '\\' OR p.barcode LIKE '${like}' ESCAPE '\\')`);
  }

  if (category && category !== 'all') {
    if (category === 'uncategorized') {
      clauses.push(`(p.category IS NULL OR TRIM(p.category) = '')`);
    } else {
      const exactCategory = escapeSqlString(category);
      const likePrefix = `${escapeSqlString(escapeSqlLike(category))}/%`;
      clauses.push(
        `(p.category = '${exactCategory}' OR p.category LIKE '${likePrefix}' ESCAPE '\\')`
      );
    }
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

const MAX_STOCK_QUANTITY = 2147483647;

const validateQuantity = (quantity: unknown): void => {
  const qty = parseInt(String(quantity));
  if (isNaN(qty)) return;
  if (qty > MAX_STOCK_QUANTITY) {
    const message = `Quantity exceeds maximum allowed limit (${MAX_STOCK_QUANTITY})`;
    throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
  }
  if (qty < -MAX_STOCK_QUANTITY) {
    const message = `Quantity is below minimum allowed limit (-${MAX_STOCK_QUANTITY})`;
    throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
  }
};

const buildWhereFilter = ({ search, category }: ProductListFilters) => {
  const andFilters: Prisma.ProductWhereInput[] = [{ isDeleted: false }];

  const normalizedSearch = normalizeSearch(search);
  if (normalizedSearch) {
    // Support multi-barcode search: search for exact match or as part of pipe-separated list
    andFilters.push({
      OR: [{ name: { contains: normalizedSearch } }, { barcode: { contains: normalizedSearch } }],
    });
  }

  if (category && category !== 'all') {
    if (category === 'uncategorized') {
      andFilters.push({
        OR: [{ category: null }, { category: '' }, { category: { equals: ' ' } }],
      });
    } else {
      andFilters.push({
        OR: [{ category }, { category: { startsWith: `${category}/` } }],
      });
    }
  }

  return { AND: andFilters };
};

/**
 * Row shape of the raw product-list aggregate. $queryRawUnsafe returns unknown,
 * so the columns SELECTed by getAllProducts are declared here. snake_case
 * matches the SQL aliases rather than the Prisma model.
 */
interface ProductListRow {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  batchTrackingEnabled: boolean;
  lowStockWarningEnabled: boolean;
  lowStockThreshold: number;
  createdAt: string;
  lastUpdatedAt: number | null;
  total_stock: number;
  total_cost: number;
  total_selling: number;
}

const getAllProducts = async ({
  page = 1,
  pageSize = 25,
  search = '',
  category = 'all',
  sortBy = 'name',
  sortOrder = 'asc',
} = {}) => {
  const safeSortBy =
    {
      name: 'p.name',
      barcode: 'p.barcode',
      createdAt: 'p.createdAt',
      stock: 'total_stock',
      lowStockWarningEnabled: 'p.lowStockWarningEnabled',
      batchTrackingEnabled: 'p.batchTrackingEnabled',
      lastUpdatedAt: 'lastUpdatedAt',
    }[sortBy] || 'p.name';
  const safeOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const whereSql = buildWhereSql({ search, category });
  const offset = Math.max(0, (Number(page) - 1) * Number(pageSize));
  const limit = Math.max(1, Number(pageSize));

  const totalRows = await prisma.$queryRawUnsafe<{ count: number | bigint }[]>(`
        SELECT COUNT(*) as count
        FROM Product p
        ${whereSql}
    `);
  const total = Number(totalRows?.[0]?.count || 0);

  const rows = await prisma.$queryRawUnsafe<ProductListRow[]>(`
        SELECT
            p.id,
            p.name,
            p.barcode,
            NULLIF(TRIM(p.category), '') as category,
            p.batchTrackingEnabled,
            p.lowStockWarningEnabled,
            p.lowStockThreshold,
            p.createdAt,
            MAX(CASE WHEN b.updatedAt IS NULL THEN p.updatedAt WHEN b.updatedAt > p.updatedAt THEN b.updatedAt ELSE p.updatedAt END) as lastUpdatedAt,
            CAST(COALESCE(SUM(b.quantity), 0) AS INTEGER) as total_stock,
            CAST(COALESCE(SUM(b.quantity * b.costPrice), 0) AS REAL) as total_cost,
            CAST(COALESCE(SUM(b.quantity * b.sellingPrice), 0) AS REAL) as total_selling
        FROM Product p
        LEFT JOIN Batch b ON b.productId = p.id AND b.isDeleted = 0
        ${whereSql}
        GROUP BY p.id
        ORDER BY ${safeSortBy} ${safeOrder}
        LIMIT ${limit} OFFSET ${offset}
    `);

  return {
    items: rows.map((row) => ({
      ...row,
      lastUpdatedAt: row.lastUpdatedAt != null ? new Date(Number(row.lastUpdatedAt)).toISOString() : null,
      total_stock: Number(row.total_stock || 0),
      total_cost: Number(row.total_cost || 0),
      total_selling: Number(row.total_selling || 0),
    })),
    total,
  };
};

const getAllProductsWithBatches = async ({ search = '', category = 'all' } = {}) => {
  const baseWhere = buildWhereFilter({ search, category: 'all' });
  const where =
    category === 'all' || category === 'uncategorized'
      ? baseWhere
      : buildWhereFilter({ search, category });

  const activeCategorySalesMap = await categorySaleService.getActiveCategorySalesMap();

  const products = await prisma.product.findMany({
    where,
    include: {
      batches: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
      },
      promotions: {
        where: {
          promotion: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
        include: {
          promotion: true,
        },
      },
    },
  });

  const normalized = products.map((product) => {
    // Find the best active promo price
    let promoPrice: number | null = null;
    if (product.promotions && product.promotions.length > 0) {
      let lowest = Infinity;
      product.promotions.forEach((pItem) => {
        if (pItem.promoPrice < lowest) {
          lowest = pItem.promoPrice;
        }
      });
      if (lowest !== Infinity) promoPrice = lowest;
    }

    // Factor active category sale discount
    const normCategory = normalizeCategory(product.category);
    if (normCategory) {
      const catKey = normCategory.toLowerCase().trim();
      const catSale = activeCategorySalesMap.get(catKey);
      if (catSale && catSale.discountPercentage > 0 && !catSale.excludedProductIds.has(product.id)) {
        const latestBatch = product.batches[0];
        const mrp = latestBatch?.mrp ?? 0;
        const sellingPrice = latestBatch?.sellingPrice ?? 0;
        const basePrice = mrp > 0 ? mrp : sellingPrice;
        if (basePrice > 0) {
          const categorySalePrice =
            Math.round(basePrice * (1 - catSale.discountPercentage / 100) * 100) / 100;
          if (promoPrice === null || categorySalePrice < promoPrice) {
            promoPrice = categorySalePrice;
          }
        }
      }
    }

    return {
      ...product,
      category: normCategory,
      total_stock: product.batches.reduce((sum, batch) => sum + batch.quantity, 0),
      promoPrice,
      isOnSale: promoPrice !== null,
    };
  });

  if (category === 'uncategorized') {
    return normalized.filter((product) => !normalizeCategory(product.category));
  }

  return normalized;
};

/** Aggregate row returned by the summary query below. */
interface ProductSummaryRow {
  product_count: number | bigint;
  total_qty: number;
  total_cost: number;
  total_selling: number;
  total_mrp: number;
}

const getProductSummary = async ({ search = '', category = 'all' }: ProductListFilters = {}) => {
  const whereSql = buildWhereSql({ search, category });
  const whereFilter = buildWhereFilter({ search, category });
  const rows = await prisma.$queryRawUnsafe<ProductSummaryRow[]>(`
        SELECT
            COUNT(DISTINCT p.id) as product_count,
            CAST(COALESCE(SUM(b.quantity), 0) AS INTEGER) as total_qty,
            CAST(COALESCE(SUM(b.quantity * b.costPrice), 0) AS REAL) as total_cost,
            CAST(COALESCE(SUM(b.quantity * b.sellingPrice), 0) AS REAL) as total_selling,
            CAST(COALESCE(SUM(b.quantity * b.mrp), 0) AS REAL) as total_mrp
        FROM Product p
        LEFT JOIN Batch b ON b.productId = p.id AND b.isDeleted = 0
        ${whereSql}
    `);

  const summaryRow: Partial<ProductSummaryRow> = rows?.[0] || {};

  const categorySourceFilter =
    category === 'uncategorized' ? buildWhereFilter({ search, category: 'all' }) : whereFilter;

  // Optimized: use groupBy to get counts per category directly from DB
  const categoryGroups = await prisma.product.groupBy({
    by: ['category'],
    where: categorySourceFilter,
    _count: {
      id: true,
    },
  });

  // Full category path -> product count, accumulated up each ancestor.
  const categoryCounts: Record<string, number> = {};
  let uncategorizedCount = 0;
  let totalCount = 0;

  categoryGroups.forEach((group) => {
    const count = group._count.id;
    totalCount += count;
    const normalizedCategory = normalizeCategory(group.category);

    if (!normalizedCategory) {
      uncategorizedCount += count;
      return;
    }

    const parts = normalizedCategory.split('/');
    let path = '';
    parts.forEach((part) => {
      path = path ? `${path}/${part}` : part;
      categoryCounts[path] = (categoryCounts[path] || 0) + count;
    });
  });

  return {
    totals: {
      productCount: Number(summaryRow.product_count || 0),
      totalQty: Number(summaryRow.total_qty || 0),
      totalCost: Number(summaryRow.total_cost || 0),
      totalSelling: Number(summaryRow.total_selling || 0),
      totalMrp: Number(summaryRow.total_mrp || 0),
    },
    categoryCounts,
    uncategorizedCount,
    totalCount,
  };
};

const getProductById = async (id: number | string) => {
  const product = await prisma.product.findFirst({
    where: { id: parseInt(String(id)), isDeleted: false },
    include: {
      batches: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!product) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

  const total_stock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
  const total_cost = product.batches.reduce((sum, b) => sum + b.costPrice * b.quantity, 0);
  const total_selling = product.batches.reduce((sum, b) => sum + b.sellingPrice * b.quantity, 0);

  return {
    ...product,
    category: normalizeCategory(product.category),
    total_stock,
    total_cost,
    total_selling,
  };
};

const getProductByBarcode = async (barcode: string) => {
  const normalizedBarcode = normalizeSearch(barcode);
  if (!normalizedBarcode) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }
  // Support multi-barcode search: find product where barcode matches exactly
  // or is part of a pipe-separated list (e.g., "123|456|789")
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      OR: [
        { barcode: normalizedBarcode }, // Exact match
        { barcode: { startsWith: `${normalizedBarcode}|` } }, // First in list
        { barcode: { endsWith: `|${normalizedBarcode}` } }, // Last in list
        { barcode: { contains: `|${normalizedBarcode}|` } }, // Middle of list
      ],
    },
    include: {
      batches: {
        where: { quantity: { gt: 0 }, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!products || products.length === 0) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

  const product = products[0]; // Take first match if multiple
  const { batches, ...productData } = product;
  return {
    product: {
      ...productData,
      category: normalizeCategory(productData.category),
    },
    batches,
  };
};

/**
 * Fields createOrUpdateProduct reads from an initial-batch payload.
 */
interface InitialBatchPricingInput {
  mrp?: number | string | null;
  cost_price?: number | string | null;
  selling_price?: number | string | null;
  batch_code?: string | null;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | string | null;
  wholesaleMinQty?: number | string | null;
  expiryDate?: string | Date | null;
}

/**
 * Parses and validates the pricing/batch-code portion of an initial-batch
 * payload. Quantity is deliberately excluded: createOrUpdateProduct
 * validates it separately with validateQuantity.
 */
const parseInitialBatchPricing = (
  initialBatch: InitialBatchPricingInput,
  batchTrackingEnabled: boolean
) => {
  const { mrp, cost_price, selling_price, batch_code, expiryDate } = initialBatch;
  const mrpValue = parseFloat(String(mrp)) || 0;
  const costValue = parseFloat(String(cost_price)) || 0;
  const sellingValue = parseFloat(String(selling_price)) || 0;
  validatePricing({
    mrp: mrpValue,
    costPrice: costValue,
    sellingPrice: sellingValue,
  });

  // Auto-generate batch code if empty (only for batch tracking enabled products)
  const finalBatchCode =
    batchTrackingEnabled && (!batch_code || !batch_code.trim())
      ? generateBatchCode()
      : batch_code || null;

  return {
    mrpValue,
    costValue,
    sellingValue,
    finalBatchCode,
    wholesalePrice: initialBatch.wholesalePrice
      ? parseFloat(String(initialBatch.wholesalePrice))
      : null,
    wholesaleMinQty: initialBatch.wholesaleMinQty
      ? parseInt(String(initialBatch.wholesaleMinQty))
      : null,
    expiryDateValue: expiryDate ? new Date(expiryDate) : null,
  };
};

const createOrUpdateProduct = async ({
  name,
  barcode,
  category,
  initialBatch,
  enableBatchTracking,
  lowStockWarningEnabled,
  lowStockThreshold,
}: CreateProductInput) => {
  // name/category/barcode/initialBatch presence is already enforced by
  // CreateProductSchema (required string min-length + a non-optional
  // initialBatch object) at the router boundary — no need to recheck it here.
  // The numeric checks below are NOT duplicated by that schema: mrp/cost_price
  // /selling_price/quantity are typed as a string|number union there (to
  // accept raw form-input text), so Zod never validates they parse to a
  // valid, non-negative number, or that sellingPrice falls between cost and
  // MRP. This is the only place that business rule is enforced.
  const mrp = Number(initialBatch.mrp);
  const costPrice = Number(initialBatch.cost_price);
  const sellingPrice = Number(initialBatch.selling_price);
  const quantity = Number(initialBatch.quantity);

  if (isNaN(mrp) || mrp < 0) {
    throw createHttpError(400, 'MRP is required and must be 0 or greater');
  }
  if (isNaN(costPrice) || costPrice < 0) {
    throw createHttpError(400, 'Cost price is required and must be 0 or greater');
  }
  if (isNaN(sellingPrice) || sellingPrice < 0) {
    throw createHttpError(400, 'Selling price is required and must be 0 or greater');
  }
  if (sellingPrice < costPrice || sellingPrice > mrp) {
    throw createHttpError(400, 'Selling price must be between Cost Price and MRP');
  }
  if (isNaN(quantity) || quantity < 0) {
    throw createHttpError(400, 'Quantity is required and must be 0 or greater');
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Support multi-barcode: validate each barcode uniqueness
    if (barcode && barcode.trim()) {
      await _validateBarcodesUniqueness(tx, barcode);
    }

    const product = await tx.product.create({
      data: {
        name,
        barcode: barcode && barcode.trim() ? barcode : null,
        category: normalizeCategory(category),
        batchTrackingEnabled: enableBatchTracking === true,
        lowStockWarningEnabled: lowStockWarningEnabled === true,
        lowStockThreshold: lowStockWarningEnabled ? parseInt(String(lowStockThreshold)) || 0 : 0,
      },
      include: {
        batches: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (initialBatch) {
      const qtyToAdd = parseInt(String(initialBatch.quantity)) || 0;
      validateQuantity(qtyToAdd);
      const parsed = parseInitialBatchPricing(initialBatch, product.batchTrackingEnabled);

      // The product was just created above, so it has no batches yet — both the
      // tracked and untracked flows create the product's first batch here, with
      // identical data. Only `finalBatchCode` differs, resolved above.
      await createBatchWithMovement(tx, {
        productId: product.id,
        batchCode: parsed.finalBatchCode,
        quantity: qtyToAdd,
        mrp: parsed.mrpValue,
        costPrice: parsed.costValue,
        sellingPrice: parsed.sellingValue,
        wholesaleEnabled: initialBatch.wholesaleEnabled === true,
        wholesalePrice: parsed.wholesalePrice,
        wholesaleMinQty: parsed.wholesaleMinQty,
        expiryDate: parsed.expiryDateValue,
        note: 'Initial stock',
      });
    }
    // Background sync to ensure Category table reflects new strings
    categoryService
      .ensureCategoriesFromProducts()
      .catch((err) => logger.error({ err: err.message }, 'Category sync error'));
    return product;
  });
};

/**
 * Batch payload as the client sends it: snake_case form keys, values that may
 * be strings straight from text inputs. Deliberately not a Prisma input type —
 * the mapping to Batch happens inside these functions.
 */
export interface BatchInput {
  product_id?: number | string;
  batch_code?: string | null;
  quantity?: number | string;
  mrp?: number | string;
  cost_price?: number | string;
  selling_price?: number | string;
  expiryDate?: string | Date | null;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | string | null;
  wholesaleMinQty?: number | string | null;
  [key: string]: unknown;
}

const addBatch = async (batchData: BatchInput) => {
  const { product_id, batch_code, quantity, mrp, cost_price, selling_price, expiryDate } =
    batchData;

  // Validate inputs before touching the DB
  const qtyToAdd = parseInt(String(quantity)) || 0;
  validateQuantity(qtyToAdd);
  const mrpValue = parseFloat(String(mrp)) || 0;
  const costValue = parseFloat(String(cost_price)) || 0;
  const sellingValue = parseFloat(String(selling_price)) || 0;
  validatePricing({
    mrp: mrpValue,
    costPrice: costValue,
    sellingPrice: sellingValue,
    wholesaleEnabled: batchData.wholesaleEnabled,
    wholesalePrice: batchData.wholesalePrice ? parseFloat(String(batchData.wholesalePrice)) : undefined,
  });

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const product = await tx.product.findUnique({
      where: { id: parseInt(String(product_id)) },
      include: { batches: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
    });

    if (!product) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
        error: 'Product not found',
      });
    }

    // Auto-generate batch code if empty (only for batch tracking enabled products)
    const finalBatchCode =
      product.batchTrackingEnabled && (!batch_code || !batch_code.trim())
        ? generateBatchCode()
        : batch_code || null;

    const batchFields = {
      productId: product.id,
      batchCode: finalBatchCode,
      quantity: qtyToAdd,
      mrp: mrpValue,
      costPrice: costValue,
      sellingPrice: sellingValue,
      wholesaleEnabled: batchData.wholesaleEnabled === true,
      wholesalePrice: batchData.wholesalePrice ? parseFloat(String(batchData.wholesalePrice)) : null,
      wholesaleMinQty: batchData.wholesaleMinQty ? parseInt(String(batchData.wholesaleMinQty)) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      note: 'Stock added',
    };

    // Batch tracking ON — every addition becomes its own batch record.
    if (product.batchTrackingEnabled) {
      const batch = await createBatchWithMovement(tx, batchFields);
      return { ...batch, created: true };
    }

    // Batch tracking OFF — accumulate into the product's single logical batch.
    const existingBatch = product.batches[0];
    if (existingBatch) {
      const batch = await addQuantityToBatch(tx, { batch: existingBatch, qtyToAdd, note: 'Stock added' });
      return { ...batch, created: false };
    }

    // No existing batch — create the first batch for this non-tracked product.
    const batch = await createBatchWithMovement(tx, batchFields);
    return { ...batch, created: true };
  });
};

const updateProduct = async (id: string | number, productData: UpdateProductInput) => {
  const {
    name,
    category,
    barcode,
    batchTrackingEnabled,
    lowStockWarningEnabled,
    lowStockThreshold,
  } = productData;
  const updateData: Prisma.ProductUpdateInput = {
    name,
    barcode,
    ...(batchTrackingEnabled !== undefined ? { batchTrackingEnabled } : {}),
    ...(lowStockWarningEnabled !== undefined ? { lowStockWarningEnabled } : {}),
    ...(lowStockThreshold !== undefined
      ? { lowStockThreshold: parseInt(String(lowStockThreshold)) || 0 }
      : {}),
  };
  if (category !== undefined) {
    updateData.category = normalizeCategory(category);
  }
  const productId = parseInt(String(id));

  // Check barcode uniqueness for update
  if (barcode && barcode.trim()) {
    await _validateBarcodesUniqueness(prisma, barcode, productId);
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // When enabling batch tracking, assign batch codes to any existing batches that lack one
    if (batchTrackingEnabled === true) {
      const current = await tx.product.findUnique({ where: { id: productId } });
      if (current && !current.batchTrackingEnabled) {
        const batchesWithoutCode = await tx.batch.findMany({
          where: { productId, batchCode: null, isDeleted: false },
        });
        for (const b of batchesWithoutCode) {
          await tx.batch.update({
            where: { id: b.id },
            data: { batchCode: generateBatchCode() },
          });
        }
      }
    }

    return tx.product.update({
      where: { id: productId },
      data: updateData,
    });
  });

  // Background sync to ensure Category table reflects potentially new strings
  // (categoryService is imported at the top of this file)
  categoryService
    .ensureCategoriesFromProducts()
    .catch((err) => logger.error({ err: err.message }, 'Category sync error'));

  return updated;
};

const deleteProduct = async (id: string | number) => {
  const productId = parseInt(String(id));
  return await prisma.product.update({
    where: { id: productId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      barcode: null,
    },
  });
};

/** Batch edit payload — camelCase here, unlike the snake_case create path. */
export interface BatchUpdateInput {
  batchCode?: string | null;
  quantity?: number | string;
  mrp?: number | string;
  costPrice?: number | string;
  sellingPrice?: number | string;
  expiryDate?: string | Date | null;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | string | null;
  wholesaleMinQty?: number | string | null;
}

const updateBatch = async (id: number | string, batchData: BatchUpdateInput) => {
  const { batchCode, quantity, mrp, costPrice, sellingPrice, expiryDate } = batchData;
  const existing = await prisma.batch.findUnique({
    where: { id: parseInt(String(id)) },
  });
  if (!existing || existing.isDeleted) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Batch not found', {
      error: 'Batch not found',
    });
  }
  const nextMrp = mrp !== undefined ? parseFloat(String(mrp)) : existing.mrp;
  const nextCost = costPrice !== undefined ? parseFloat(String(costPrice)) : existing.costPrice;
  const nextSelling = sellingPrice !== undefined ? parseFloat(String(sellingPrice)) : existing.sellingPrice;
  const nextWholesaleEnabled =
    batchData.wholesaleEnabled !== undefined ? batchData.wholesaleEnabled : existing.wholesaleEnabled;
  const nextWholesalePrice =
    batchData.wholesalePrice !== undefined
      ? parseFloat(String(batchData.wholesalePrice))
      : existing.wholesalePrice;
  validatePricing({
    mrp: nextMrp,
    costPrice: nextCost,
    sellingPrice: nextSelling,
    wholesaleEnabled: nextWholesaleEnabled,
    wholesalePrice: nextWholesalePrice,
  });

  const nextQuantity = quantity !== undefined ? parseInt(String(quantity)) : existing.quantity;
  validateQuantity(nextQuantity);
  const delta = nextQuantity - existing.quantity;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedBatch = await tx.batch.update({
      where: { id: parseInt(String(id)) },
      data: {
        batchCode,
        quantity: quantity !== undefined ? parseInt(String(quantity)) : undefined,
        mrp: mrp !== undefined ? parseFloat(String(mrp)) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(String(costPrice)) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(String(sellingPrice)) : undefined,
        wholesaleEnabled:
          batchData.wholesaleEnabled !== undefined ? batchData.wholesaleEnabled : undefined,
        wholesalePrice:
          batchData.wholesalePrice !== undefined ? parseFloat(String(batchData.wholesalePrice)) : undefined,
        wholesaleMinQty:
          batchData.wholesaleMinQty !== undefined ? parseInt(String(batchData.wholesaleMinQty)) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });
    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          productId: existing.productId,
          batchId: existing.id,
          type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
          quantity: Math.abs(delta),
          note: 'Manual batch edit',
        },
      });
    }
    return updatedBatch;
  });
};

/**
 * Active stock is always protected, regardless of sales history. A
 * zero-quantity batch with no sales history is hard-deleted (nothing
 * references it). A zero-quantity batch WITH sales history is retired
 * (isDeleted) instead of physically deleted — SaleItem.batchId is a
 * required FK with ON DELETE RESTRICT, so the database itself would
 * reject a hard delete here; retiring keeps the row (and its
 * StockMovement history) intact for Sale History/Reports/Product
 * History, which all resolve product/batch identity via a live join
 * through this row, not a stored snapshot.
 */
const deleteBatch = async (id: number | string): Promise<{ softDeleted: boolean }> => {
  const existing = await prisma.batch.findUnique({
    where: { id: parseInt(String(id)) },
    include: { _count: { select: { saleItems: true } } },
  });
  if (!existing || existing.isDeleted) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Batch not found', {
      error: 'Batch not found',
    });
  }
  if (existing.quantity > 0) {
    const message = `This batch still has ${existing.quantity} unit(s) in stock. Reduce its quantity to 0 before deleting it.`;
    throw createHttpError(StatusCodes.BAD_REQUEST, message, { error: message });
  }
  if (existing._count.saleItems > 0) {
    await prisma.batch.update({
      where: { id: parseInt(String(id)) },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { softDeleted: true };
  }
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.stockMovement.deleteMany({ where: { batchId: parseInt(String(id)) } });
    await tx.batch.delete({ where: { id: parseInt(String(id)) } });
  });
  return { softDeleted: false };
};

// Helper function to escape CSV values according to RFC 4180
const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const exportProducts = async () => {
  // Every other product-listing method in this file filters isDeleted:false
  // on both Product and Batch (see getAllProductsWithBatches/getProductById
  // above) — this one didn't, so a soft-deleted product or a retired batch
  // (see the Batch.isDeleted schema comment) was silently included in the
  // exported CSV.
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: {
      batches: { where: { isDeleted: false } },
    },
  });

  const csvRows: string[] = [];
  csvRows.push(
    'name,barcode,category,quantity,mrp,cost_price,selling_price,wholesale_price,wholesale_min_qty,wholesale_enabled,batch_code,expiry_date'
  );

  for (const product of products) {
    if (product.batches && product.batches.length > 0) {
      for (const batch of product.batches) {
        csvRows.push(
          [
            escapeCSVValue(product.name),
            product.barcode ? `="${product.barcode}"` : '',
            escapeCSVValue(product.category),
            batch.quantity,
            batch.mrp,
            batch.costPrice,
            batch.sellingPrice,
            batch.wholesalePrice || '',
            batch.wholesaleMinQty || '',
            batch.wholesaleEnabled ? 'TRUE' : 'FALSE',
            escapeCSVValue(batch.batchCode),
            batch.expiryDate ? batch.expiryDate.toISOString().split('T')[0] : '',
          ].join(',')
        );
      }
    } else {
      csvRows.push(
        [
          escapeCSVValue(product.name),
          product.barcode ? `="${product.barcode}"` : '',
          escapeCSVValue(product.category),
          0,
          0,
          0,
          0,
          '',
          '',
          'FALSE',
          '',
          '',
        ].join(',')
      );
    }
  }

  return csvRows.join('\n');
};

/** One parsed CSV row, ready to be written by persistImportedProducts. */
interface ParsedImportRow {
  name: string;
  barcode: string | null;
  category: string | null;
  batchTrackingEnabled: boolean;
  qty: number;
  mrpVal: number;
  costVal: number;
  sellingVal: number;
  wholesaleEnabled: boolean;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
  batch_code?: string;
  expiry_date?: string;
}

interface ImportError {
  line: number;
  message: string;
}

/** Parsing/validation only — no writes. Bad rows are collected as errors, not thrown. */
const parseImportRows = async (
  csvData: string
): Promise<{ rows: ParsedImportRow[]; errors: ImportError[]; importedCount: number; failedCount: number }> => {
  const lines = csvData.split('\n').filter((line) => line.trim());
  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map((h) => h.trim().toLowerCase());

  const errors: ImportError[] = [];
  let importedCount = 0;
  let failedCount = 0;

  // Fetch all existing barcodes ONCE at the beginning (optimization)
  const existingProducts = await prisma.product.findMany({
    where: {
      barcode: { not: null },
    },
    select: { barcode: true },
  });
  const existingBarcodeMap = new Map();
  existingProducts.forEach((p) => {
    if (p.barcode) {
      existingBarcodeMap.set(p.barcode.toLowerCase(), true);
    }
  });

  // Track barcodes within this CSV import to catch duplicates
  const csvBarcodes = new Set();

  // Prepare all product and batch data in memory first
  const productsToCreate: ParsedImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    try {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });

      const name = row.name;
      let barcode = row.barcode ? row.barcode.trim() : null;

      // Strip exactly ="[value]" format used to prevent Excel scientific notation
      if (barcode && barcode.startsWith('="') && barcode.endsWith('"')) {
        barcode = barcode.slice(2, -1);
      }

      if (barcode && /^\d+\.00$/.test(barcode)) {
        barcode = barcode.replace('.00', '');
      }

      // The headers are mapped to lowercase in importProducts
      const {
        category,
        quantity,
        mrp,
        cost_price,
        selling_price,
        wholesale_price,
        wholesale_min_qty,
        wholesale_enabled,
        batch_code,
        expiry_date,
      } = row;

      if (!name || !name.trim()) {
        errors.push({ line: lineNumber, message: 'Missing name' });
        failedCount++;
        continue;
      }

      const qty = parseInt(String(quantity)) || 0;
      validateQuantity(qty);
      const mrpVal = parseFloat(String(mrp)) || 0;
      const costVal = parseFloat(String(cost_price)) || 0;
      const sellingVal = parseFloat(String(selling_price)) || 0;
      const enableBatchTracking = !!(batch_code && batch_code.trim());

      if (barcode && barcode.trim()) {
        const trimmedBarcode = barcode.trim();
        const lowerBarcode = trimmedBarcode.toLowerCase();

        // Detailed database check for uniqueness including multi-barcode support
        try {
          await _validateBarcodesUniqueness(prisma, trimmedBarcode);
        } catch (error) {
          const message = getErrorMessage(error);
          if (message.startsWith('BARCODE_CONFLICT:')) {
            errors.push({
              line: lineNumber,
              message: message.replace('BARCODE_CONFLICT: ', ''),
            });
            failedCount++;
            continue;
          }
          throw error;
        }

        if (csvBarcodes.has(lowerBarcode)) {
          errors.push({
            line: lineNumber,
            message: 'Duplicate barcode in CSV',
          });
          failedCount++;
          continue;
        }
        csvBarcodes.add(lowerBarcode);
      }

      // Prepare product and batch creation
      productsToCreate.push({
        name: name.trim(),
        barcode: barcode && barcode.trim() ? barcode.trim() : null,
        category: normalizeCategory(category),
        batchTrackingEnabled: enableBatchTracking,
        qty,
        mrpVal,
        costVal,
        sellingVal,
        wholesaleEnabled: !!(wholesale_enabled && wholesale_enabled.toUpperCase() === 'TRUE'),
        wholesalePrice: parseFloat(String(wholesale_price)) || null,
        wholesaleMinQty: parseInt(String(wholesale_min_qty)) || null,
        batch_code,
        expiry_date,
      });
      importedCount++;
    } catch (error) {
      errors.push({ line: lineNumber, message: getErrorMessage(error) });
      failedCount++;
    }
  }

  return { rows: productsToCreate, errors, importedCount, failedCount };
};

/** Writes all parsed rows atomically, then kicks off the (fire-and-forget) category sync. */
const persistImportedProducts = async (rows: ParsedImportRow[]): Promise<void> => {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const prod of rows) {
      const product = await tx.product.create({
        data: {
          name: prod.name,
          barcode: prod.barcode,
          category: prod.category,
          batchTrackingEnabled: prod.batchTrackingEnabled,
        },
      });
      await createBatchWithMovement(tx, {
        productId: product.id,
        batchCode: prod.batch_code || null,
        quantity: prod.qty,
        mrp: prod.mrpVal,
        costPrice: prod.costVal,
        sellingPrice: prod.sellingVal,
        expiryDate: prod.expiry_date ? new Date(prod.expiry_date) : null,
        note: 'Imported stock',
        skipMovementWhenZero: true,
      });
    }
  });

  // Background sync to ensure Category table reflects new strings
  categoryService
    .ensureCategoriesFromProducts()
    .catch((err) => logger.error({ err: err.message }, 'Category sync error'));
};

const importProducts = async (csvData: string) => {
  const { rows, errors, importedCount, failedCount } = await parseImportRows(csvData);

  const results: {
    success: boolean;
    imported: number;
    failed: number;
    errors: ImportError[];
  } = {
    success: false,
    imported: importedCount,
    failed: failedCount,
    errors,
  };

  // If no products to create and no errors (e.g. empty file or just header), treat as error
  if (rows.length === 0 && failedCount === 0) {
    results.errors.push({
      line: 0,
      message: 'No valid products found in file',
    });
    return results;
  }

  // If any errors, discard all
  if (failedCount > 0) {
    results.imported = 0;
    return results;
  }

  // All rows valid, perform atomic import
  await persistImportedProducts(rows);

  results.success = true;
  return results;
};

const validateBarcodes = async (barcodes: string[]): Promise<string[]> => {
  const existingBarcodes: string[] = [];

  // Get all products with barcodes
  const allProducts = await prisma.product.findMany({
    where: {
      barcode: { not: null },
    },
    select: { barcode: true },
  });

  for (const barcode of barcodes) {
    if (!barcode || !barcode.trim()) continue;

    const trimmedBarcode = barcode.trim();
    const lowerBarcode = trimmedBarcode.toLowerCase();

    // Check exact match (case-insensitive)
    const hasExactMatch = allProducts.some(
      (p) => p.barcode && p.barcode.toLowerCase() === lowerBarcode
    );

    if (hasExactMatch) {
      existingBarcodes.push(trimmedBarcode);
      continue;
    }

    // Check if barcode exists as part of multi-barcode (case-insensitive)
    const hasMultiMatch = allProducts.some((p) => {
      if (!p.barcode) return false;
      const pBarcode = p.barcode.toLowerCase();
      return (
        pBarcode.startsWith(`${lowerBarcode}|`) ||
        pBarcode.endsWith(`|${lowerBarcode}`) ||
        pBarcode.includes(`|${lowerBarcode}|`)
      );
    });

    if (hasMultiMatch) {
      existingBarcodes.push(trimmedBarcode);
    }
  }

  return existingBarcodes;
};

interface HistoryRangeOptions {
  range?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const buildHistoryRange = ({ range, startDate, endDate }: HistoryRangeOptions) => {
  const { start, end } = getDateRange(range, startDate, endDate);
  return {
    from: start ? new Date(start) : null,
    to: end ? new Date(end) : null,
  };
};

/**
 * Running totals per movement type, used for both the per-batch map and the
 * overall total in getProductHistory. Module-scoped (not declared inline in
 * that function) and exported: getProductHistory's inferred return type
 * references it, and an exported function cannot use a type declaration
 * emit (server/tsconfig.build.json's `declaration: true`) can't see —
 * TS4025. Purely a declaration-location change, no behavior change.
 */
export interface MovementTotals {
  added: number;
  sold: number;
  returned: number;
  adjustmentIn: number;
  adjustmentOut: number;
  net: number;
}

const getProductHistory = async (
  productId: number | string,
  { range = 'today', startDate, endDate, page = 1, pageSize = 100 }: HistoryRangeOptions = {}
) => {
  const id = parseInt(String(productId));
  const { from, to } = buildHistoryRange({ range, startDate, endDate });
  const where: Prisma.StockMovementWhereInput = { productId: id };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  // Totals/summaryByDate must reflect the ENTIRE range, not just the current
  // page, so they're computed from a lightweight query (no batch include)
  // over every matching row, separate from the paginated list below.
  const movementsForTotals = await prisma.stockMovement.findMany({
    where,
    select: { type: true, quantity: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const [movements, totalCount] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        batch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const summaryMap = new Map<string, MovementTotals & { date: string }>();
  const totals: MovementTotals = {
    added: 0,
    sold: 0,
    returned: 0,
    adjustmentIn: 0,
    adjustmentOut: 0,
    net: 0,
  };

  const applyMovement = (target: MovementTotals, movement: { type: string; quantity?: number }) => {
    const qty = movement.quantity || 0;
    switch (movement.type) {
      case 'added':
        target.added += qty;
        target.net += qty;
        break;
      case 'sold':
        target.sold += qty;
        target.net -= qty;
        break;
      case 'returned':
        target.returned += qty;
        target.net += qty;
        break;
      case 'adjustment_in':
        target.adjustmentIn += qty;
        target.net += qty;
        break;
      case 'adjustment_out':
        target.adjustmentOut += qty;
        target.net -= qty;
        break;
      default:
        break;
    }
  };

  movementsForTotals.forEach((movement) => {
    const dateKey = movement.createdAt.toISOString().split('T')[0];
    let summary = summaryMap.get(dateKey);
    if (!summary) {
      summary = {
        date: dateKey,
        added: 0,
        sold: 0,
        returned: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
        net: 0,
      };
      summaryMap.set(dateKey, summary);
    }
    applyMovement(summary, movement);
    applyMovement(totals, movement);
  });

  const summaryByDate = Array.from(summaryMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return {
    range,
    startDate: from ? from.toISOString() : null,
    endDate: to ? to.toISOString() : null,
    totals,
    summaryByDate,
    movements,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
};

export {
  getAllProducts,
  getAllProductsWithBatches,
  getProductSummary,
  getProductById,
  getProductByBarcode,
  createOrUpdateProduct,
  addBatch,
  updateProduct,
  deleteProduct,
  updateBatch,
  deleteBatch,
  exportProducts,
  importProducts,
  validateBarcodes,
  getProductHistory,
};
