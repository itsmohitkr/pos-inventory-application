const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./shared/utils/logger');

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

// Helper for lazy loading routers
const lazyLoad = (routerPath) => (req, res, next) => {
  const router = require(routerPath);
  return router(req, res, next);
};

apiRouter.use('/auth', authLimiter, lazyLoad('./domains/auth/auth.router'));
apiRouter.use(lazyLoad('./domains/product/product.router'));
apiRouter.use(lazyLoad('./domains/category/category.router'));
apiRouter.use(lazyLoad('./domains/sale/sale.router'));
apiRouter.use(lazyLoad('./domains/report/report.router'));
apiRouter.use(lazyLoad('./domains/loose-sale/loose-sale.router'));
apiRouter.use(lazyLoad('./domains/promotion/promotion.router'));
apiRouter.use('/expenses', lazyLoad('./domains/expense/expense.router'));
apiRouter.use('/purchases', lazyLoad('./domains/purchase/purchase.router'));
apiRouter.use('/settings', lazyLoad('./domains/setting/setting.router'));
apiRouter.use('/customers', lazyLoad('./domains/customer/customer.router'));
apiRouter.use('/whatsapp', lazyLoad('./domains/whatsapp/whatsapp.router'));

// Handle legacy un-prefixed routes if any (all should be prefixed now)
// Note: If any routes were previously mounted without prefix (e.g. app.use(productRoutes)), 
// they should now be accessed via /api/products etc.

app.use('/api', apiRouter);
app.use(pathNotFound);
app.use(errorHandler);

module.exports = app;
