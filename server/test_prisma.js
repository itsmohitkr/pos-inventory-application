const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    if (fs.existsSync('./tmp_test.db')) fs.unlinkSync('./tmp_test.db');
    
    process.env.DATABASE_URL = "file:./tmp_test.db";
    const prisma = new PrismaClient();
    
    // Create old schema
    await prisma.$executeRawUnsafe(`CREATE TABLE "Batch" ( "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT )`);
    
    // Migrate to new schema
    await prisma.$executeRawUnsafe(`ALTER TABLE "Batch" ADD COLUMN "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Batch" ADD COLUMN "wholesalePrice" REAL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Batch" ADD COLUMN "wholesaleMinQty" INTEGER`);
    
    // Test Prisma findMany
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT * FROM "Batch"`);
        console.log("Raw query:", result);
    } catch(e) { console.error("RAW FAILED:", e); }
    
    // We cannot test prisma.batch.findMany() because our generated client requires the FULL schema tables (Product, etc) to exist.
    // So let's create ALL of them as dummy tables just to see if findMany crashes!
}
main();
