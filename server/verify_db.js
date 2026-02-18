// Use the same config as the application to verify
const prisma = require('./src/config/prisma');

async function main() {
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.user.count();
        console.log(`Users count: ${userCount}`);

        const productCount = await prisma.product.count();
        console.log(`Products count: ${productCount}`);

        console.log('Database verification successful! Tables exist and are accessible.');
    } catch (e) {
        console.error('Database verification failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
