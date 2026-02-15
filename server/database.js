const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventory.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            barcode TEXT UNIQUE NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Batches Table
        // product_id links to products(id)
        // quantity: current stock
        // mrp: Maximum Retail Price
        // cost_price: Buying Price
        // selling_price: Actual Selling Price
        db.run(`CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            batch_code TEXT,
            quantity INTEGER NOT NULL DEFAULT 0,
            mrp REAL NOT NULL,
            cost_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        console.log('Database tables initialized.');
    });
}

module.exports = db;
