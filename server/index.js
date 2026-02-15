require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import modular routes
const productRoutes = require('./src/routes/product.routes');
const saleRoutes = require('./src/routes/sale.routes');
const reportRoutes = require('./src/routes/report.routes');
const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/category.routes');

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

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
