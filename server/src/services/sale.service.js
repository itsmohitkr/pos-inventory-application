const prisma = require('../config/prisma');

const processSale = async ({ items, discount = 0, extraDiscount = 0 }) => {
    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const saleItemsData = [];
        const movementData = [];

        for (const item of items) {
            const batch = await tx.batch.findUnique({
                where: { id: item.batch_id }
            });

            if (!batch || batch.quantity < item.quantity) {
                throw new Error(`Insufficient stock for batch ID ${item.batch_id}`);
            }

            await tx.batch.update({
                where: { id: item.batch_id },
                data: { quantity: batch.quantity - item.quantity }
            });

            totalAmount += batch.sellingPrice * item.quantity;

            saleItemsData.push({
                batchId: item.batch_id,
                quantity: item.quantity,
                sellingPrice: batch.sellingPrice,
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
