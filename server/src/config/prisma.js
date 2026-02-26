const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Guarantee dotenv loads the .env file if DATABASE_URL is somehow missing but file exists locally
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
}

// Use DATABASE_URL from environment (set by Electron main process in production)
// or fallback to a local development default.
const DATABASE_URL = process.env.DATABASE_URL;







const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL,
        },
    },
});

module.exports = prisma;
