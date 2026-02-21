const express = require('express');
const router = express.Router();
const looseSaleController = require('../controllers/loose-sale.controller');

router.post('/loose-sales', looseSaleController.createLooseSale);
router.get('/reports/loose-sales', looseSaleController.getLooseSalesReport);

module.exports = router;
