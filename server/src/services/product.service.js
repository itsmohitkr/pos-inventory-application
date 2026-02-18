const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');

const normalizeCategory = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const normalizeSearch = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
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

const validatePricing = ({ mrp, costPrice, sellingPrice }) => {
    if (mrp === undefined || costPrice === undefined || sellingPrice === undefined) return;
    if (Number.isNaN(mrp) || Number.isNaN(costPrice) || Number.isNaN(sellingPrice)) {
        throw new Error('Invalid pricing values');
    }
    if (sellingPrice < costPrice || sellingPrice > mrp) {
        throw new Error('Selling price must be between cost price and MRP');
    }
};

const buildWhereSql = ({ search, category }) => {
    const clauses = [];

    const normalizedSearch = normalizeSearch(search);
    if (normalizedSearch) {
        const like = `%${normalizedSearch}%`;
        // Support multi-barcode search: search for exact match or as part of pipe-separated list
        clauses.push(Prisma.sql`(p.name LIKE ${like} OR p.barcode LIKE ${like})`);
    }

    if (category && category !== 'all') {
        if (category === 'uncategorized') {
            clauses.push(Prisma.sql`(p.category IS NULL OR TRIM(p.category) = '')`);
        } else {
            const like = `${category}/%`;
            clauses.push(Prisma.sql`(p.category = ${category} OR p.category LIKE ${like})`);
        }
    }

    if (!clauses.length) {
        return Prisma.sql``;
    }

    return Prisma.sql`WHERE ${Prisma.join(clauses, Prisma.sql` AND `)}`;
};

const buildWhereFilter = ({ search, category }) => {
    const andFilters = [];

    const normalizedSearch = normalizeSearch(search);
    if (normalizedSearch) {
        // Support multi-barcode search: search for exact match or as part of pipe-separated list
        andFilters.push({
            OR: [
                { name: { contains: normalizedSearch, mode: 'insensitive' } },
                { barcode: { contains: normalizedSearch, mode: 'insensitive' } }
            ]
        });
    }

    if (category && category !== 'all') {
        if (category === 'uncategorized') {
            andFilters.push({ OR: [{ category: null }, { category: '' }, { category: { equals: ' ' } }] });
        } else {
            andFilters.push({
                OR: [
                    { category },
                    { category: { startsWith: `${category}/` } }
                ]
            });
        }
    }

    if (!andFilters.length) return {};
    return { AND: andFilters };
};

const getAllProducts = async ({ page = 1, pageSize = 25, search = '', category = 'all', sortBy = 'name', sortOrder = 'asc' } = {}) => {
    const safeSortBy = {
        name: 'p.name',
        barcode: 'p.barcode',
        createdAt: 'p.createdAt',
        stock: 'total_stock'
    }[sortBy] || 'p.name';
    const safeOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const whereSql = buildWhereSql({ search, category });
    const offset = Math.max(0, (Number(page) - 1) * Number(pageSize));
    const limit = Math.max(1, Number(pageSize));

    const totalRows = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM Product p
        ${whereSql}
    `;
    const total = Number(totalRows?.[0]?.count || 0);

    const rows = await prisma.$queryRaw`
        SELECT
            p.id,
            p.name,
            p.barcode,
            NULLIF(TRIM(p.category), '') as category,
            p.batchTrackingEnabled,
            p.lowStockWarningEnabled,
            p.lowStockThreshold,
            p.createdAt,
            CAST(COALESCE(SUM(b.quantity), 0) AS INTEGER) as total_stock,
            CAST(COALESCE(SUM(b.quantity * b.costPrice), 0) AS REAL) as total_cost,
            CAST(COALESCE(SUM(b.quantity * b.sellingPrice), 0) AS REAL) as total_selling
        FROM Product p
        LEFT JOIN Batch b ON b.productId = p.id
        ${whereSql}
        GROUP BY p.id
        ORDER BY ${Prisma.raw(safeSortBy)} ${Prisma.raw(safeOrder)}
        LIMIT ${limit} OFFSET ${offset}
    `;

    return {
        items: rows.map((row) => ({
            ...row,
            total_stock: Number(row.total_stock || 0),
            total_cost: Number(row.total_cost || 0),
            total_selling: Number(row.total_selling || 0)
        })),
        total
    };
};

const getAllProductsWithBatches = async ({ search = '', category = 'all' } = {}) => {
    const baseWhere = buildWhereFilter({ search, category: 'all' });
    const where = category === 'all' || category === 'uncategorized'
        ? baseWhere
        : buildWhereFilter({ search, category });
    const products = await prisma.product.findMany({
        where,
        include: {
            batches: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    const normalized = products.map((product) => ({
        ...product,
        category: normalizeCategory(product.category),
        total_stock: product.batches.reduce((sum, batch) => sum + batch.quantity, 0)
    }));

    if (category === 'uncategorized') {
        return normalized.filter((product) => !normalizeCategory(product.category));
    }

    return normalized;
};

const getProductSummary = async ({ search = '', category = 'all' } = {}) => {
    const whereSql = buildWhereSql({ search, category });
    const whereFilter = buildWhereFilter({ search, category });
    const rows = await prisma.$queryRaw`
        SELECT
            COUNT(DISTINCT p.id) as product_count,
            CAST(COALESCE(SUM(b.quantity), 0) AS INTEGER) as total_qty,
            CAST(COALESCE(SUM(b.quantity * b.costPrice), 0) AS REAL) as total_cost,
            CAST(COALESCE(SUM(b.quantity * b.sellingPrice), 0) AS REAL) as total_selling
        FROM Product p
        LEFT JOIN Batch b ON b.productId = p.id
        ${whereSql}
    `;

    const summaryRow = rows?.[0] || {};

    const categorySourceFilter = category === 'uncategorized'
        ? buildWhereFilter({ search, category: 'all' })
        : whereFilter;
    const categories = await prisma.product.findMany({
        where: categorySourceFilter,
        select: { category: true }
    });
    const categoryCounts = categories.reduce((acc, product) => {
        const normalizedCategory = normalizeCategory(product.category);
        if (!normalizedCategory) return acc;
        const parts = normalizedCategory.split('/').filter(Boolean);
        let path = '';
        parts.forEach((part) => {
            path = path ? `${path}/${part}` : part;
            acc[path] = (acc[path] || 0) + 1;
        });
        return acc;
    }, {});
    const uncategorizedCount = categories.filter((product) => !normalizeCategory(product.category)).length;

    return {
        totals: {
            productCount: Number(summaryRow.product_count || 0),
            totalQty: Number(summaryRow.total_qty || 0),
            totalCost: Number(summaryRow.total_cost || 0),
            totalSelling: Number(summaryRow.total_selling || 0)
        },
        categoryCounts,
        uncategorizedCount,
        totalCount: categories.length
    };
};

const getProductById = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
            batches: {
                orderBy: { createdAt: 'asc' }
            }
        }
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
        total_selling
    };
};

const getProductByBarcode = async (barcode) => {
    const normalizedBarcode = normalizeSearch(barcode);
    if (!normalizedBarcode) return null;
    // Support multi-barcode search: find product where barcode matches exactly
    // or is part of a pipe-separated list (e.g., "123|456|789")
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { barcode: normalizedBarcode },                       // Exact match
                { barcode: { startsWith: `${normalizedBarcode}|` } }, // First in list
                { barcode: { endsWith: `|${normalizedBarcode}` } },   // Last in list
                { barcode: { contains: `|${normalizedBarcode}|` } }   // Middle of list
            ]
        },
        include: {
            batches: {
                where: { quantity: { gt: 0 } },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!products || products.length === 0) return null;

    const product = products[0]; // Take first match if multiple
    const { batches, ...productData } = product;
    return { product: { ...productData, category: normalizeCategory(productData.category) }, batches };
};

const createOrUpdateProduct = async ({ name, barcode, category, initialBatch, enableBatchTracking, lowStockWarningEnabled, lowStockThreshold }) => {
    return await prisma.$transaction(async (tx) => {
        // Support multi-barcode: validate each barcode in pipe-separated list (only if barcode provided)
        if (barcode && barcode.trim()) {
            const barcodes = barcode.split('|').map(b => b.trim()).filter(Boolean);

            for (const singleBarcode of barcodes) {
                const existing = await tx.product.findFirst({
                    where: {
                        OR: [
                            { barcode: singleBarcode },
                            { barcode: { startsWith: `${singleBarcode}|` } },
                            { barcode: { endsWith: `|${singleBarcode}` } },
                            { barcode: { contains: `|${singleBarcode}|` } }
                        ]
                    }
                });

                if (existing) {
                    throw new Error(`Barcode '${singleBarcode}' already exists`);
                }
            }
        }

        const product = await tx.product.create({
            data: {
                name,
                barcode: barcode && barcode.trim() ? barcode : null,
                category: normalizeCategory(category),
                batchTrackingEnabled: enableBatchTracking === true,
                lowStockWarningEnabled: lowStockWarningEnabled === true,
                lowStockThreshold: lowStockWarningEnabled ? parseInt(lowStockThreshold) || 0 : 0
            },
            include: {
                batches: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (initialBatch) {
            const { quantity, mrp, cost_price, selling_price, batch_code, expiryDate } = initialBatch;
            const qtyToAdd = parseInt(quantity) || 0;
            const mrpValue = parseFloat(mrp) || 0;
            const costValue = parseFloat(cost_price) || 0;
            const sellingValue = parseFloat(selling_price) || 0;
            validatePricing({ mrp: mrpValue, costPrice: costValue, sellingPrice: sellingValue });

            // Auto-generate batch code if empty (only for batch tracking enabled products)
            const finalBatchCode = (product.batchTrackingEnabled && (!batch_code || !batch_code.trim()))
                ? generateBatchCode()
                : (batch_code || null);

            if (product.batchTrackingEnabled) {
                const createdBatch = await tx.batch.create({
                    data: {
                        productId: product.id,
                        batchCode: finalBatchCode,
                        quantity: qtyToAdd,
                        mrp: mrpValue,
                        costPrice: costValue,
                        sellingPrice: sellingValue,
                        expiryDate: expiryDate ? new Date(expiryDate) : null
                    }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        batchId: createdBatch.id,
                        type: 'added',
                        quantity: qtyToAdd,
                        note: 'Initial stock'
                    }
                });
            } else {
                const existingBatch = (product.batches || [])[0];

                if (existingBatch) {
                    await tx.batch.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: existingBatch.quantity + qtyToAdd
                        }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: product.id,
                            batchId: existingBatch.id,
                            type: 'added',
                            quantity: qtyToAdd,
                            note: 'Initial stock'
                        }
                    });
                } else {
                    const createdBatch = await tx.batch.create({
                        data: {
                            productId: product.id,
                            batchCode: finalBatchCode,
                            quantity: qtyToAdd,
                            mrp: mrpValue,
                            costPrice: costValue,
                            sellingPrice: sellingValue,
                            expiryDate: expiryDate ? new Date(expiryDate) : null
                        }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: product.id,
                            batchId: createdBatch.id,
                            type: 'added',
                            quantity: qtyToAdd,
                            note: 'Initial stock'
                        }
                    });
                }
            }
        }
        return product;
    });
};

const addBatch = async (batchData) => {
    const { product_id, batch_code, quantity, mrp, cost_price, selling_price, expiryDate } = batchData;
    const product = await prisma.product.findUnique({
        where: { id: parseInt(product_id) },
        include: {
            batches: { orderBy: { createdAt: 'asc' } }
        }
    });

    if (!product) {
        throw new Error('Product not found');
    }

    const qtyToAdd = parseInt(quantity);
    const mrpValue = parseFloat(mrp);
    const costValue = parseFloat(cost_price);
    const sellingValue = parseFloat(selling_price);
    validatePricing({ mrp: mrpValue, costPrice: costValue, sellingPrice: sellingValue });

    // Auto-generate batch code if empty (only for batch tracking enabled products)
    const finalBatchCode = (product.batchTrackingEnabled && (!batch_code || !batch_code.trim()))
        ? generateBatchCode()
        : (batch_code || null);

    if (product.batchTrackingEnabled) {
        const createdBatch = await prisma.batch.create({
            data: {
                productId: parseInt(product_id),
                batchCode: finalBatchCode,
                quantity: qtyToAdd,
                mrp: mrpValue,
                costPrice: costValue,
                sellingPrice: sellingValue,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        });
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                batchId: createdBatch.id,
                type: 'added',
                quantity: qtyToAdd,
                note: 'Stock added'
            }
        });
        return createdBatch;
    }

    const existingBatch = product.batches[0];
    if (existingBatch) {
        const updatedBatch = await prisma.batch.update({
            where: { id: existingBatch.id },
            data: {
                quantity: existingBatch.quantity + qtyToAdd
            }
        });
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                batchId: existingBatch.id,
                type: 'added',
                quantity: qtyToAdd,
                note: 'Stock added'
            }
        });
        return updatedBatch;
    }

    const createdBatch = await prisma.batch.create({
        data: {
            productId: parseInt(product_id),
            batchCode: batch_code,
            quantity: qtyToAdd,
            mrp: mrpValue,
            costPrice: costValue,
            sellingPrice: sellingValue,
            expiryDate: expiryDate ? new Date(expiryDate) : null
        }
    });
    await prisma.stockMovement.create({
        data: {
            productId: product.id,
            batchId: createdBatch.id,
            type: 'added',
            quantity: qtyToAdd,
            note: 'Stock added'
        }
    });
    return createdBatch;
};

const updateProduct = async (id, productData) => {
    const { name, category, barcode, batchTrackingEnabled, lowStockWarningEnabled, lowStockThreshold } = productData;
    const updateData = {
        name,
        barcode,
        ...(batchTrackingEnabled !== undefined ? { batchTrackingEnabled } : {}),
        ...(lowStockWarningEnabled !== undefined ? { lowStockWarningEnabled } : {}),
        ...(lowStockThreshold !== undefined ? { lowStockThreshold: parseInt(lowStockThreshold) || 0 } : {})
    };
    if (category !== undefined) {
        updateData.category = normalizeCategory(category);
    }
    return await prisma.product.update({
        where: { id: parseInt(id) },
        data: updateData
    });
};

const deleteProduct = async (id) => {
    return await prisma.$transaction(async (tx) => {
        await tx.batch.deleteMany({
            where: { productId: parseInt(id) }
        });
        await tx.product.delete({
            where: { id: parseInt(id) }
        });
    });
};

const updateBatch = async (id, batchData) => {
    const { batchCode, quantity, mrp, costPrice, sellingPrice, expiryDate } = batchData;
    const existing = await prisma.batch.findUnique({
        where: { id: parseInt(id) }
    });
    if (!existing) {
        throw new Error('Batch not found');
    }
    const nextMrp = mrp !== undefined ? parseFloat(mrp) : existing.mrp;
    const nextCost = costPrice !== undefined ? parseFloat(costPrice) : existing.costPrice;
    const nextSelling = sellingPrice !== undefined ? parseFloat(sellingPrice) : existing.sellingPrice;
    validatePricing({ mrp: nextMrp, costPrice: nextCost, sellingPrice: nextSelling });

    const nextQuantity = quantity !== undefined ? parseInt(quantity) : existing.quantity;
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id) },
        data: {
            batchCode,
            quantity: quantity !== undefined ? parseInt(quantity) : undefined,
            mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
            costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
            sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
            expiryDate: expiryDate ? new Date(expiryDate) : null
        }
    });
    const delta = nextQuantity - existing.quantity;
    if (delta !== 0) {
        await prisma.stockMovement.create({
            data: {
                productId: existing.productId,
                batchId: existing.id,
                type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
                quantity: Math.abs(delta),
                note: 'Manual batch edit'
            }
        });
    }
    return updatedBatch;
};

const deleteBatch = async (id) => {
    const existing = await prisma.batch.findUnique({
        where: { id: parseInt(id) }
    });
    if (!existing) {
        throw new Error('Batch not found');
    }
    return await prisma.$transaction(async (tx) => {
        await tx.stockMovement.deleteMany({
            where: { batchId: parseInt(id) }
        });
        await tx.saleItem.deleteMany({
            where: { batchId: parseInt(id) }
        });
        await tx.batch.delete({
            where: { id: parseInt(id) }
        });
    });
};

// Helper function to escape CSV values according to RFC 4180
const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

const exportProducts = async () => {
    const products = await prisma.product.findMany({
        include: {
            batches: true
        }
    });

    const csvRows = [];
    csvRows.push('name,barcode,category,quantity,mrp,cost_price,selling_price,batch_code,expiry_date');

    for (const product of products) {
        if (product.batches && product.batches.length > 0) {
            for (const batch of product.batches) {
                csvRows.push([
                    escapeCSVValue(product.name),
                    product.barcode ? `"${product.barcode}"` : '',  // Quote barcode to preserve as text
                    escapeCSVValue(product.category),
                    batch.quantity,
                    batch.mrp,
                    batch.costPrice,
                    batch.sellingPrice,
                    escapeCSVValue(batch.batchCode),
                    batch.expiryDate ? batch.expiryDate.toISOString().split('T')[0] : ''
                ].join(','));
            }
        } else {
            csvRows.push([
                escapeCSVValue(product.name),
                product.barcode ? `"${product.barcode}"` : '',  // Quote barcode to preserve as text
                escapeCSVValue(product.category),
                0,
                0,
                0,
                0,
                '',
                ''
            ].join(','));
        }
    }

    return csvRows.join('\n');
};

const importProducts = async (csvData) => {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headerValues = parseCSVLine(lines[0]);
    const headers = headerValues.map(h => h.trim().toLowerCase());

    const results = {
        success: false,
        imported: 0,
        failed: 0,
        errors: []
    };

    // Fetch all existing barcodes ONCE at the beginning (optimization)
    const existingProducts = await prisma.product.findMany({
        where: {
            barcode: { not: null }
        },
        select: { barcode: true }
    });
    const existingBarcodeMap = new Map();
    existingProducts.forEach(p => {
        if (p.barcode) {
            existingBarcodeMap.set(p.barcode.toLowerCase(), true);
        }
    });

    // Track barcodes within this CSV import to catch duplicates
    const csvBarcodes = new Set();

    // Prepare all product and batch data in memory first
    const productsToCreate = [];
    const batchesToCreate = [];
    const stockMovementsToCreate = [];

    for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        try {
            const values = parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });

            const name = row.name;
            let barcode = row.barcode ? row.barcode.trim() : null;
            if (barcode && /^\d+\.00$/.test(barcode)) {
                barcode = barcode.replace('.00', '');
            }

            const { category, quantity, mrp, cost_price, selling_price, batch_code, expiry_date } = row;

            if (!name || !name.trim()) {
                results.errors.push({ line: lineNumber, message: 'Missing name' });
                results.failed++;
                continue;
            }

            const qty = parseInt(quantity) || 0;
            const mrpVal = parseFloat(mrp) || 0;
            const costVal = parseFloat(cost_price) || 0;
            const sellingVal = parseFloat(selling_price) || 0;
            const enableBatchTracking = !!(batch_code && batch_code.trim());

            if (barcode && barcode.trim()) {
                const trimmedBarcode = barcode.trim();
                const lowerBarcode = trimmedBarcode.toLowerCase();
                if (existingBarcodeMap.has(lowerBarcode)) {
                    results.errors.push({ line: lineNumber, message: 'Barcode already exists in database' });
                    results.failed++;
                    continue;
                }
                const hasMultiMatch = existingProducts.some(p => {
                    if (!p.barcode) return false;
                    const pBarcode = p.barcode.toLowerCase();
                    return pBarcode.startsWith(`${lowerBarcode}|`) ||
                        pBarcode.endsWith(`|${lowerBarcode}`) ||
                        pBarcode.includes(`|${lowerBarcode}|`);
                });
                if (hasMultiMatch) {
                    results.errors.push({ line: lineNumber, message: 'Barcode already exists in database as part of multi-barcode' });
                    results.failed++;
                    continue;
                }
                if (csvBarcodes.has(lowerBarcode)) {
                    results.errors.push({ line: lineNumber, message: 'Duplicate barcode in CSV' });
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
                batch_code,
                expiry_date
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
        results.errors.push({ line: 0, message: "No valid products found in file" });
        return results;
    }

    // If any errors, discard all
    if (results.failed > 0) {
        results.success = false;
        results.imported = 0;
        return results;
    }

    // All rows valid, perform atomic import
    await prisma.$transaction(async (tx) => {
        for (const prod of productsToCreate) {
            const product = await tx.product.create({
                data: {
                    name: prod.name,
                    barcode: prod.barcode,
                    category: prod.category,
                    batchTrackingEnabled: prod.batchTrackingEnabled
                }
            });
            if (prod.qty > 0 && prod.mrpVal > 0) {
                const createdBatch = await tx.batch.create({
                    data: {
                        productId: product.id,
                        batchCode: prod.batch_code || null,
                        quantity: prod.qty,
                        mrp: prod.mrpVal,
                        costPrice: prod.costVal,
                        sellingPrice: prod.sellingVal,
                        expiryDate: prod.expiry_date ? new Date(prod.expiry_date) : null
                    }
                });
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        batchId: createdBatch.id,
                        type: 'added',
                        quantity: prod.qty,
                        note: 'Imported stock'
                    }
                });
            }
        }
    });
    results.success = true;
    return results;
};

const validateBarcodes = async (barcodes) => {
    const existingBarcodes = [];

    // Get all products with barcodes
    const allProducts = await prisma.product.findMany({
        where: {
            barcode: { not: null }
        },
        select: { barcode: true }
    });

    for (const barcode of barcodes) {
        if (!barcode || !barcode.trim()) continue;

        const trimmedBarcode = barcode.trim();
        const lowerBarcode = trimmedBarcode.toLowerCase();

        // Check exact match (case-insensitive)
        const hasExactMatch = allProducts.some(p =>
            p.barcode && p.barcode.toLowerCase() === lowerBarcode
        );

        if (hasExactMatch) {
            existingBarcodes.push(trimmedBarcode);
            continue;
        }

        // Check if barcode exists as part of multi-barcode (case-insensitive)
        const hasMultiMatch = allProducts.some(p => {
            if (!p.barcode) return false;
            const pBarcode = p.barcode.toLowerCase();
            return pBarcode.startsWith(`${lowerBarcode}|`) ||
                pBarcode.endsWith(`|${lowerBarcode}`) ||
                pBarcode.includes(`|${lowerBarcode}|`);
        });

        if (hasMultiMatch) {
            existingBarcodes.push(trimmedBarcode);
        }
    }

    return existingBarcodes;
};

const buildHistoryRange = ({ range, startDate, endDate }) => {
    if (startDate && endDate) {
        return {
            from: new Date(startDate),
            to: new Date(endDate)
        };
    }

    const now = new Date();
    const from = new Date(now);
    if (range === 'today') {
        from.setHours(0, 0, 0, 0);
        return { from, to: now };
    }
    if (range === 'week') {
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        return { from, to: now };
    }
    if (range === 'month') {
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        return { from, to: now };
    }
    return { from: null, to: null };
};

const getProductHistory = async (productId, { range = 'today', startDate, endDate } = {}) => {
    const id = parseInt(productId);
    const { from, to } = buildHistoryRange({ range, startDate, endDate });
    const where = { productId: id };
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = from;
        if (to) where.createdAt.lte = to;
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        include: {
            batch: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const summaryMap = new Map();
    const totals = {
        added: 0,
        sold: 0,
        returned: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
        net: 0
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
                net: 0
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
        movements
    };
};

module.exports = {
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
    getProductHistory
};
