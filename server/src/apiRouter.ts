import express = require('express');
import { authLimiter, passwordLimiter } from './shared/middleware/rateLimiters';
import { lazyLoad } from './shared/middleware/lazyLoad';

const router = express.Router();

router.use('/auth/login', passwordLimiter);
router.use('/auth/verify-admin', passwordLimiter);
router.use('/auth', authLimiter, lazyLoad('../../domains/auth/auth.router'));
router.use(lazyLoad('../../domains/product/product.router'));
router.use(lazyLoad('../../domains/category/category.router'));
router.use(lazyLoad('../../domains/sale/sale.router'));
router.use(lazyLoad('../../domains/report/report.router'));
router.use(lazyLoad('../../domains/loose-sale/loose-sale.router'));
router.use(lazyLoad('../../domains/promotion/promotion.router'));
router.use('/expenses', lazyLoad('../../domains/expense/expense.router'));
router.use('/purchases', lazyLoad('../../domains/purchase/purchase.router'));
router.use('/category-sales', lazyLoad('../../domains/category-sale/category-sale.router'));
router.use('/settings', lazyLoad('../../domains/setting/setting.router'));
router.use('/customers', lazyLoad('../../domains/customer/customer.router'));

export = router;
 