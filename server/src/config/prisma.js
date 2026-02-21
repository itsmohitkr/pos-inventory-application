const { PrismaClient } = require('@prisma/client');
if (!process.env.DATABASE_URL) {
    require('dotenv').config();
}

// Use DATABASE_URL from environment (set by Electron main process in production)
// or fallback to a local development default.
const DATABASE_URL = process.env.DATABASE_URL;

console.log('---------------------------------------------------');
console.log('PRISMA CONFIG LOADED');
console.log('DATABASE_URL:', DATABASE_URL);
console.log('Prisma Engine Path:', process.env.PRISMA_QUERY_ENGINE_LIBRARY || 'default');
console.log('---------------------------------------------------');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL,
        },
    },
});

module.exports = prisma;
