const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');

router.post('/sale', saleController.processSale);
router.get('/sale/:id', saleController.getSaleById);
router.post('/sale/:id/return', saleController.processReturn);

module.exports = router;
