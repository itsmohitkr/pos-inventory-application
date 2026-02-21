require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const prisma = require('./src/config/prisma');

// Import modular routes
const productRoutes = require('./src/routes/product.routes');
const saleRoutes = require('./src/routes/sale.routes');
const reportRoutes = require('./src/routes/report.routes');
const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/category.routes');
const looseSaleRoutes = require('./src/routes/loose-sale.routes');
const promotionRoutes = require('./src/routes/promotion.routes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Main API Router
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use(productRoutes);
apiRouter.use(categoryRoutes);
apiRouter.use(saleRoutes);
apiRouter.use(reportRoutes);
apiRouter.use(looseSaleRoutes);
apiRouter.use(promotionRoutes);

app.use('/api', apiRouter);

// Auto-seed database on first run
async function checkAndSeed() {
    try {
        // Check if any users exist in the database
        const userCount = await prisma.user.count();

        if (userCount === 0) {
            console.log('Database is empty. Running seed script...');

            // Run essential seed script only (admin user etc)
            const { seedEssential } = require('./seed');
            await seedEssential();
            console.log('Database initialized successfully!');
        } else {
            console.log('Database already seeded.');
        }
    } catch (error) {
        console.error('Error checking/seeding database:', error);
    }
}

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Run seed in background or before listen?
    // Let's run it here but catch errors and ensure we don't exit.
    try {
        await checkAndSeed();
    } catch (e) {
        console.error("Seeding failed but server is running:", e);
    }
});

// Keep process alive hack
setInterval(() => { }, 10000);
