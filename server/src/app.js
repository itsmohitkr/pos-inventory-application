const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./shared/utils/logger');

// Import modular routes
const productRoutes = require('./domains/product/product.router');
const categoryRoutes = require('./domains/category/category.router');
const saleRoutes = require('./domains/sale/sale.router');
const reportRoutes = require('./domains/report/report.router');
const authRoutes = require('./domains/auth/auth.router');
const looseSaleRoutes = require('./domains/loose-sale/loose-sale.router');
const promotionRoutes = require('./domains/promotion/promotion.router');
const expenseRoutes = require('./domains/expense/expense.router');
const purchaseRoutes = require('./domains/purchase/purchase.router');
const settingRoutes = require('./domains/setting/setting.router');
const customerRoutes = require('./domains/customer/customer.router');
const whatsappRoutes = require('./domains/whatsapp/whatsapp.router');
const pathNotFound = require('./shared/error/pathNotFound');
const errorHandler = require('./shared/error/errorHandler');

const app = express();

// Production security middleware
app.use(helmet());

// Restrict to localhost origins only (Electron renderer uses null origin in production,
// localhost:5173 in dev with Vite)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
}));

// Hard-reject any request not originating from the local machine.
// The server binds to 127.0.0.1, so this is defence-in-depth against
// misconfigured reverse proxies or future bind changes.
app.use((req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  logger.warn({ ip, url: req.url }, 'Rejected non-localhost request');
  return res.status(403).json({ error: 'Forbidden' });
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for sensitive routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Request logging middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
    next();
});

// Main API Router
const apiRouter = express.Router();
apiRouter.use('/auth', authLimiter, authRoutes);
apiRouter.use(productRoutes);
apiRouter.use(categoryRoutes);
apiRouter.use(saleRoutes);
apiRouter.use(reportRoutes);
apiRouter.use(looseSaleRoutes);
apiRouter.use(promotionRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/purchases', purchaseRoutes);
apiRouter.use('/settings', settingRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/whatsapp', whatsappRoutes);

app.use('/api', apiRouter);
app.use(pathNotFound);
app.use(errorHandler);

module.exports = app;
