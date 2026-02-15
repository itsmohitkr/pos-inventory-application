const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/product.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/products', productController.getAllProducts);
router.get('/products/summary', productController.getProductSummary);
router.get('/products/export', productController.exportProducts);
router.post('/products/import', upload.single('file'), productController.importProducts);
router.post('/products/validate-barcodes', productController.validateBarcodes);
router.get('/products/id/:id', productController.getProductById);
router.get('/products/:id/history', productController.getProductHistory);
router.get('/products/:barcode', productController.getProductByBarcode);
router.post('/products', productController.createProduct);
router.post('/batches', productController.addBatch);
router.put('/products/:id', productController.updateProduct);
router.put('/batches/:id', productController.updateBatch);
router.delete('/products/:id', productController.deleteProduct);
router.delete('/batches/:id', productController.deleteBatch);

module.exports = router;
