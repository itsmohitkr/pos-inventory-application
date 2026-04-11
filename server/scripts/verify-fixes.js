const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const productService = require('../src/services/product.service');

async function testValidation() {
    console.log('\n--- Testing Quantity Validation ---');
    const MAX_INT32 = 2147483647;
    const tooLarge = MAX_INT32 + 1;

    try {
        console.log(`Attempting to add batch with quantity ${tooLarge}...`);
        // We'll use a dummy product ID if one exists, or create one
        let product = await prisma.product.findFirst();
        if (!product) {
            product = await prisma.product.create({
                data: { name: 'Test Product', barcode: 'TEST-123' }
            });
        }

        await productService.addBatch({
            product_id: product.id,
            quantity: tooLarge,
            mrp: 100,
            cost_price: 50,
            selling_price: 80
        });
        console.error('FAIL: Validation allowed a quantity exceeding MAX_INT32');
    } catch (error) {
        if (error.message.includes('Quantity exceeds maximum allowed limit')) {
            console.log('SUCCESS: Validation caught large quantity error:', error.message);
        } else {
            console.error('FAIL: Unexpected error during validation test:', error.message);
        }
    }
}

async function testDeletion() {
    console.log('\n--- Testing Product Deletion with History ---');
    try {
        // 1. Create a product
        const product = await prisma.product.create({
            data: { name: 'Delete Me', barcode: 'DEL-999' }
        });

        // 2. Create a batch
        const batch = await prisma.batch.create({
            data: {
                productId: product.id,
                quantity: 10,
                mrp: 100,
                costPrice: 50,
                sellingPrice: 80
            }
        });

        // 3. Create a movement
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                batchId: batch.id,
                type: 'added',
                quantity: 10,
                note: 'Test deletion cleanup'
            }
        });

        console.log(`Created product ${product.id} with batch ${batch.id} and stock movements.`);

        // 4. Try to delete product
        await productService.deleteProduct(product.id);
        console.log('SUCCESS: Product and related records deleted successfully.');

        // 5. Verify they are gone
        const deletedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        const deletedMovements = await prisma.stockMovement.findMany({ where: { productId: product.id } });

        if (!deletedProduct && deletedMovements.length === 0) {
            console.log('Final Verification: Records are completely gone from DB.');
        } else {
            console.error('FAIL: Records still exist in DB after deletion.');
        }

    } catch (error) {
        console.error('FAIL: Error during deletion test:', error.message);
    }
}

async function main() {
    await testValidation();
    await testDeletion();
}

main()
    .catch((e) => {
        console.error('Error in verification script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
