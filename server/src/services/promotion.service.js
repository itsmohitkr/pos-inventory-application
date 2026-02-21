const prisma = require('../config/prisma');

/**
 * Create a new promotion with items
 */
const createPromotion = async ({ name, startDate, endDate, items, isActive = true }) => {
    return await prisma.$transaction(async (tx) => {
        // Create the promotion
        const promotion = await tx.promotion.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        promoPrice: item.promoPrice,
                        discountPercentage: item.discountPercentage
                    }))
                }
            },
            include: {
                items: true
            }
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
                            barcode: true
                        }
                    }
                }
            }
        }
    });
};

/**
 * Get active promotions for a product
 */
const getActivePromotionsForProduct = async (productId, date = new Date()) => {
    return await prisma.promotion.findMany({
        where: {
            isActive: true,
            startDate: { lte: date },
            endDate: { gte: date },
            items: {
                some: {
                    productId: parseInt(productId)
                }
            }
        },
        include: {
            items: {
                where: {
                    productId: parseInt(productId)
                }
            }
        }
    });
};

/**
 * Find the best active promotional price for a product
 */
const getEffectivePromoPrice = async (productId) => {
    const activePromos = await getActivePromotionsForProduct(productId);

    if (activePromos.length === 0) return null;

    // If multiple overlapping, pick the lowest price
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

/**
 * Get product details and its current batch pricing
 * Used to help the UI show MRP/CP/SP while setting up a promotion
 */
const getProductPricingOptions = async (productId) => {
    const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: {
            batches: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!product) return null;

    const latestBatch = product.batches[0] || {};
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        mrp: latestBatch.mrp || 0,
        costPrice: latestBatch.costPrice || 0,
        sellingPrice: latestBatch.sellingPrice || 0
    };
};

/**
 * Delete a promotion
 */
const deletePromotion = async (id) => {
    return await prisma.promotion.delete({
        where: { id: parseInt(id) }
    });
};

/**
 * Update an existing promotion
 */
const updatePromotion = async (id, { name, startDate, endDate, items, isActive = true }) => {
    return await prisma.$transaction(async (tx) => {
        // Delete all existing items for this promotion
        await tx.promotionItem.deleteMany({
            where: { promotionId: parseInt(id) }
        });

        // Update the promotion and add the new items
        const promotion = await tx.promotion.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        promoPrice: item.promoPrice,
                        discountPercentage: item.discountPercentage
                    }))
                }
            },
            include: {
                items: true
            }
        });
        return promotion;
    });
};

module.exports = {
    createPromotion,
    getAllPromotions,
    getActivePromotionsForProduct,
    getEffectivePromoPrice,
    getProductPricingOptions,
    deletePromotion,
    updatePromotion
};
