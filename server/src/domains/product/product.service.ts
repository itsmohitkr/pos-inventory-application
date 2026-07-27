import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Batch, Prisma } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import { getDateRange } from '../../shared/utils/dateUtils';
import categoryService = require('../category/category.service');
import logger = require('../../shared/utils/logger');

const normalizeCategory = (value) => {
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

const normalizeSearch = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const _validateBarcodesUniqueness = async (tx, barcodeStr, excludeProductId = null) => {
  if (!barcodeStr || !barcodeStr.trim()) return;

  const barcodes = barcodeStr
    .split('|')
    .map((b) => b.trim())
    .filter(Boolean);
  for (const singleBarcode of barcodes) {
    const existing = await tx.product.findFirst({
      where: {
        isDeleted: false,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
        OR: [
          { barcode: singleBarcode },
          { barcode: { startsWith: `${singleBarcode}|` } },
          { barcode: { endsWith: `|${singleBarcode}` } },
          { barcode: { contains: `|${singleBarcode}|` } },
        ],
      },
    });

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
const parseCSVLine = (line) => {
  const result = [];
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
  wholesalePrice?: number;
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

  if (wholesaleEnabled && wholesalePrice !== undefined) {
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
const escapeSqlString = (value) => value.replace(/'/g, "''");

// Escapes LIKE metacharacters so they match literally. Only valid for values used
// in a LIKE pattern — applying it to an `=` comparison corrupts the value.
const escapeSqlLike = (value) => value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const buildWhereSql = ({ search, category }) => {
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

const validateQuantity = (quantity) => {
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

const buildWhereFilter = ({ search, category }) => {
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

  const totalRows = await prisma.$queryRawUnsafe(`
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
        LEFT JOIN Batch b ON b.productId = p.id
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
  const products = await prisma.product.findMany({
    where,
    include: {
      batches: {
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
    let promoPrice = null;
    if (product.promotions && product.promotions.length > 0) {
      let lowest = Infinity;
      product.promotions.forEach((pItem) => {
        if (pItem.promoPrice < lowest) {
          lowest = pItem.promoPrice;
        }
      });
      if (lowest !== Infinity) promoPrice = lowest;
    }

    return {
      ...product,
      category: normalizeCategory(product.category),
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

const getProductSummary = async ({ search = '', category = 'all' } = {}) => {
  const whereSql = buildWhereSql({ search, category });
  const whereFilter = buildWhereFilter({ search, category });
  const rows = await prisma.$queryRawUnsafe(`
        SELECT
            COUNT(DISTINCT p.id) as product_count,
            CAST(COALESCE(SUM(b.quantity), 0) AS INTEGER) as total_qty,
            CAST(COALESCE(SUM(b.quantity * b.costPrice), 0) AS REAL) as total_cost,
            CAST(COALESCE(SUM(b.quantity * b.sellingPrice), 0) AS REAL) as total_selling,
            CAST(COALESCE(SUM(b.quantity * b.mrp), 0) AS REAL) as total_mrp
        FROM Product p
        LEFT JOIN Batch b ON b.productId = p.id
        ${whereSql}
    `);

  const summaryRow = rows?.[0] || {};

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

  const categoryCounts = {};
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
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!product) return null;

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

const getProductByBarcode = async (barcode) => {
  const normalizedBarcode = normalizeSearch(barcode);
  if (!normalizedBarcode) return null;
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
        where: { quantity: { gt: 0 } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!products || products.length === 0) return null;

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

const createOrUpdateProduct = async ({
  name,
  barcode,
  category,
  initialBatch,
  enableBatchTracking,
  lowStockWarningEnabled,
  lowStockThreshold,
}) => {
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
      const { quantity, mrp, cost_price, selling_price, batch_code, expiryDate } = initialBatch;
      const qtyToAdd = parseInt(String(quantity)) || 0;
      validateQuantity(qtyToAdd);
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
        product.batchTrackingEnabled && (!batch_code || !batch_code.trim())
          ? generateBatchCode()
          : batch_code || null;

      // The product was just created above, so it has no batches yet — both the
      // tracked and untracked flows create the product's first batch here, with
      // identical data. Only `finalBatchCode` differs, resolved above.
      await createBatchWithMovement(tx, {
        productId: product.id,
        batchCode: finalBatchCode,
        quantity: qtyToAdd,
        mrp: mrpValue,
        costPrice: costValue,
        sellingPrice: sellingValue,
        wholesaleEnabled: initialBatch.wholesaleEnabled === true,
        wholesalePrice: initialBatch.wholesalePrice
          ? parseFloat(String(initialBatch.wholesalePrice))
          : null,
        wholesaleMinQty: initialBatch.wholesaleMinQty
          ? parseInt(String(initialBatch.wholesaleMinQty))
          : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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
      include: { batches: { orderBy: { createdAt: 'asc' } } },
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
      return createBatchWithMovement(tx, batchFields);
    }

    // Batch tracking OFF — accumulate into the product's single logical batch.
    const existingBatch = product.batches[0];
    if (existingBatch) {
      return addQuantityToBatch(tx, { batch: existingBatch, qtyToAdd, note: 'Stock added' });
    }

    // No existing batch — create the first batch for this non-tracked product.
    return createBatchWithMovement(tx, batchFields);
  });
};

const updateProduct = async (id, productData) => {
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
          where: { productId, batchCode: null },
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

const deleteProduct = async (id) => {
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
  if (!existing) {
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

const deleteBatch = async (id: number | string): Promise<void> => {
  const existing = await prisma.batch.findUnique({
    where: { id: parseInt(String(id)) },
    include: { _count: { select: { saleItems: true } } },
  });
  if (!existing) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Batch not found', {
      error: 'Batch not found',
    });
  }
  if (existing._count.saleItems > 0) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'This batch has sales history and cannot be deleted. Set its quantity to 0 to retire it instead.', {
      error: 'This batch has sales history and cannot be deleted. Set its quantity to 0 to retire it instead.',
    });
  }
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.stockMovement.deleteMany({ where: { batchId: parseInt(String(id)) } });
    await tx.batch.delete({ where: { id: parseInt(String(id)) } });
  });
};

// Helper function to escape CSV values according to RFC 4180
const escapeCSVValue = (value) => {
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
  const products = await prisma.product.findMany({
    include: {
      batches: true,
    },
  });

  const csvRows = [];
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

const importProducts = async (csvData) => {
  const lines = csvData.split('\n').filter((line) => line.trim());
  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map((h) => h.trim().toLowerCase());

  const results = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
  };

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
  const productsToCreate = [];

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
        results.errors.push({ line: lineNumber, message: 'Missing name' });
        results.failed++;
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
          if (error.message.startsWith('BARCODE_CONFLICT:')) {
            results.errors.push({
              line: lineNumber,
              message: error.message.replace('BARCODE_CONFLICT: ', ''),
            });
            results.failed++;
            continue;
          }
          throw error;
        }

        if (csvBarcodes.has(lowerBarcode)) {
          results.errors.push({
            line: lineNumber,
            message: 'Duplicate barcode in CSV',
          });
          results.failed++;
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
      results.imported++;
    } catch (error) {
      results.errors.push({ line: lineNumber, message: error.message });
      results.failed++;
    }
  }

  // If no products to create and no errors (e.g. empty file or just header), treat as error
  if (productsToCreate.length === 0 && results.failed === 0) {
    results.success = false;
    results.errors.push({
      line: 0,
      message: 'No valid products found in file',
    });
    return results;
  }

  // If any errors, discard all
  if (results.failed > 0) {
    results.success = false;
    results.imported = 0;
    return results;
  }

  // All rows valid, perform atomic import
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const prod of productsToCreate) {
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

  results.success = true;
  return results;
};

const validateBarcodes = async (barcodes: string[]): Promise<string[]> => {
  const existingBarcodes = [];

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
}

const buildHistoryRange = ({ range, startDate, endDate }: HistoryRangeOptions) => {
  const { start, end } = getDateRange(range, startDate, endDate);
  return {
    from: start ? new Date(start) : null,
    to: end ? new Date(end) : null,
  };
};

const getProductHistory = async (
  productId: number | string,
  { range = 'today', startDate, endDate }: HistoryRangeOptions = {}
) => {
  const id = parseInt(String(productId));
  const { from, to } = buildHistoryRange({ range, startDate, endDate });
  const where: Prisma.StockMovementWhereInput = { productId: id };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      batch: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const summaryMap = new Map();
  const totals = {
    added: 0,
    sold: 0,
    returned: 0,
    adjustmentIn: 0,
    adjustmentOut: 0,
    net: 0,
  };

  const applyMovement = (target, movement) => {
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

  movements.forEach((movement) => {
    const dateKey = movement.createdAt.toISOString().split('T')[0];
    if (!summaryMap.has(dateKey)) {
      summaryMap.set(dateKey, {
        date: dateKey,
        added: 0,
        sold: 0,
        returned: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
        net: 0,
      });
    }
    const summary = summaryMap.get(dateKey);
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
  };
};

const bulkCreateProducts = async (products) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const results = {
      success: true,
      count: 0,
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      const prodData = products[i];
      try {
        const {
          name,
          barcode,
          category,
          initialBatch,
          enableBatchTracking,
          lowStockWarningEnabled,
          lowStockThreshold,
        } = prodData;

        // Validate barcode uniqueness
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
        });

        if (initialBatch) {
          const { quantity, mrp, cost_price, selling_price, batch_code, expiryDate } = initialBatch;
          const qtyToAdd = parseInt(String(quantity)) || 0;
          const mrpValue = parseFloat(String(mrp)) || 0;
          const costValue = parseFloat(String(cost_price)) || 0;
          const sellingValue = parseFloat(String(selling_price)) || 0;

          validatePricing({
            mrp: mrpValue,
            costPrice: costValue,
            sellingPrice: sellingValue,
          });

          const finalBatchCode =
            product.batchTrackingEnabled && (!batch_code || !batch_code.trim())
              ? generateBatchCode()
              : batch_code || null;

          await createBatchWithMovement(tx, {
            productId: product.id,
            batchCode: finalBatchCode,
            quantity: qtyToAdd,
            mrp: mrpValue,
            costPrice: costValue,
            sellingPrice: sellingValue,
            wholesaleEnabled: initialBatch.wholesaleEnabled === true,
            wholesalePrice: initialBatch.wholesalePrice
              ? parseFloat(String(initialBatch.wholesalePrice))
              : null,
            wholesaleMinQty: initialBatch.wholesaleMinQty
              ? parseInt(String(initialBatch.wholesaleMinQty))
              : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            note: 'Bulk Initial stock',
            skipMovementWhenZero: true,
          });
        }
        results.count++;
      } catch (error) {
        // If any product fails, we roll back the entire transaction by throwing
        const message = `Error at item ${i + 1} (${prodData.name || 'Unknown'}): ${error.message}`;
        throw createHttpError(error.statusCode || StatusCodes.BAD_REQUEST, message, {
          error: message,
        });
      }
    }
    return results;
  });
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
  bulkCreateProducts,
};
