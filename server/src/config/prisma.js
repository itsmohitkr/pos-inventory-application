const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Use absolute path for SQLite database to avoid relative path issues
const dbPath = process.env.DATABASE_URL || 'file:/Users/mokumar/Downloads/POS Application/server/pos.db';

console.log('---------------------------------------------------');
console.log('PRISMA CONFIG LOADED');
console.log('Current Working Directory:', process.cwd());
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
console.log('Resolved dbPath:', dbPath);
console.log('---------------------------------------------------');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;
