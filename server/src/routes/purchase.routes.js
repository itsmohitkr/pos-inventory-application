const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');

router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.put('/:id', purchaseController.updatePurchase);
router.delete('/:id', purchaseController.deletePurchase);
router.post('/:id/payments', purchaseController.addPayment);
router.put('/payments/:id', purchaseController.updatePayment);
router.delete('/payments/:id', purchaseController.deletePayment);

module.exports = router;
