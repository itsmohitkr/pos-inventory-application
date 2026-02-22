const prisma = require('../config/prisma');

const getEffectivePromoPrice = async (tx, productId, date = new Date()) => {
    const activePromos = await tx.promotion.findMany({
        where: {
            isActive: true,
            startDate: { lte: date },
            endDate: { gte: date },
            items: { some: { productId: parseInt(productId) } }
        },
        include: {
            items: { where: { productId: parseInt(productId) } }
        }
    });

    if (activePromos.length === 0) return null;

    let lowestPrice = Infinity;
    activePromos.forEach(promo => {
        promo.items.forEach(item => {
            if (item.promoPrice < lowestPrice) {
                lowestPrice = item.promoPrice;
            }
        });
    });

    return lowestPrice === Infinity ? null : lowestPrice;
};

const processSale = async ({ items, discount = 0, extraDiscount = 0 }) => {
    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const saleItemsData = [];
        const movementData = [];

        for (const item of items) {
            const batch = await tx.batch.findUnique({
                where: { id: item.batch_id },
                include: { product: true }
            });

            if (!batch) {
                throw new Error(`Batch ID ${item.batch_id} not found.`);
            }

            if (batch.quantity < item.quantity) {
                const productName = batch.product?.name || 'Unknown Product';
                throw new Error(`Insufficient stock for ${productName} (Batch ID ${item.batch_id}). Available: ${batch.quantity}, Required: ${item.quantity}.`);
            }

            await tx.batch.update({
                where: { id: item.batch_id },
                data: { quantity: batch.quantity - item.quantity }
            });

            // Promotion Lookup
            const promoPrice = await getEffectivePromoPrice(tx, batch.productId);

            // Determine effective price
            let effectivePrice = batch.sellingPrice;

            // 1. Check Wholesale (highest priority if applicable)
            if (batch.wholesaleEnabled && batch.wholesaleMinQty && item.quantity >= batch.wholesaleMinQty) {
                effectivePrice = batch.wholesalePrice;
            }
            // 2. Check Promotion
            else if (promoPrice !== null && promoPrice < batch.sellingPrice) {
                effectivePrice = promoPrice;
            }

            totalAmount += effectivePrice * item.quantity;

            saleItemsData.push({
                batchId: item.batch_id,
                quantity: item.quantity,
                sellingPrice: effectivePrice, // Record the actual price sold at
                costPrice: batch.costPrice,
                mrp: batch.mrp
            });

            movementData.push({
                productId: batch.productId,
                batchId: batch.id,
                type: 'sold',
                quantity: item.quantity,
                note: 'Sale'
            });
        }

        const sale = await tx.sale.create({
            data: {
                totalAmount: totalAmount - discount - extraDiscount,
                discount: discount,
                extraDiscount: extraDiscount,
                items: {
                    create: saleItemsData
                }
            }
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
                                    category: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
};

const processReturn = async (saleId, returnItems) => {
    return await prisma.$transaction(async (tx) => {
        for (const item of returnItems) {
            const saleItem = await tx.saleItem.findUnique({
                where: { id: item.saleItemId }
            });

            if (!saleItem) throw new Error(`Sale item ${item.saleItemId} not found`);

            const remainingQty = saleItem.quantity - saleItem.returnedQuantity;
            if (item.quantity > remainingQty) {
                throw new Error(`Cannot return more than sold quantity for item ${saleItem.id}`);
            }

            // Update SaleItem
            await tx.saleItem.update({
                where: { id: item.saleItemId },
                data: { returnedQuantity: saleItem.returnedQuantity + item.quantity }
            });

            // Update Batch stock
            await tx.batch.update({
                where: { id: saleItem.batchId },
                data: { quantity: { increment: item.quantity } }
            });

            const batch = await tx.batch.findUnique({
                where: { id: saleItem.batchId }
            });

            if (batch) {
                await tx.stockMovement.create({
                    data: {
                        productId: batch.productId,
                        batchId: batch.id,
                        type: 'returned',
                        quantity: item.quantity,
                        note: 'Return'
                    }
                });
            }
        }
        return { message: "Return processed successfully" };
    });
};

module.exports = {
    processSale,
    getSaleById,
    processReturn
};
