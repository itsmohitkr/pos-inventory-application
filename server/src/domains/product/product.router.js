const express = require('express');
const multer = require('multer');
const productController = require('./product.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router
    .route('/products')
    .get(asyncHandler(productController.getAllProducts))
    .post(asyncHandler(productController.createProduct))
    .all(methodNotAllowed);

router
    .route('/products/summary')
    .get(asyncHandler(productController.getProductSummary))
    .all(methodNotAllowed);

router
    .route('/products/export')
    .get(asyncHandler(productController.exportProducts))
    .all(methodNotAllowed);

router
    .route('/products/import')
    .post(upload.single('file'), asyncHandler(productController.importProducts))
    .all(methodNotAllowed);

router
    .route('/products/bulk')
    .post(asyncHandler(productController.bulkCreateProducts))
    .all(methodNotAllowed);

router
    .route('/products/validate-barcodes')
    .post(asyncHandler(productController.validateBarcodes))
    .all(methodNotAllowed);

router
    .route('/products/id/:id')
    .get(asyncHandler(productController.getProductById))
    .all(methodNotAllowed);

router
    .route('/products/:id/history')
    .get(asyncHandler(productController.getProductHistory))
    .all(methodNotAllowed);

// Keep barcode lookup as GET-only without `.all(methodNotAllowed)` because this
// path shape overlaps with `/products/:id` mutation routes.
router.get('/products/:barcode', asyncHandler(productController.getProductByBarcode));

router
    .route('/products/:id')
    .put(asyncHandler(productController.updateProduct))
    .delete(asyncHandler(productController.deleteProduct));

router
    .route('/batches')
    .post(asyncHandler(productController.addBatch))
    .all(methodNotAllowed);

router
    .route('/batches/:id')
    .put(asyncHandler(productController.updateBatch))
    .delete(asyncHandler(productController.deleteBatch))
    .all(methodNotAllowed);

module.exports = router;
