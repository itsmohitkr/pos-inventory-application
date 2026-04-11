const express = require('express');
const multer = require('multer');
const productController = require('./product.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const validateUploadedFile = require('../../shared/middleware/validateUploadedFile');
const {
    productIdParamSchema,
    batchIdParamSchema,
    barcodeParamSchema,
    productQuerySchema,
    productSummaryQuerySchema,
    productHistoryQuerySchema,
    createProductBodySchema,
    addBatchBodySchema,
    updateProductBodySchema,
    updateBatchBodySchema,
    validateBarcodesBodySchema,
    bulkCreateProductsBodySchema
} = require('./product.validation');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router
    .route('/products')
    .get(validateRequest({ query: productQuerySchema }), asyncHandler(productController.getAllProducts))
    .post(validateRequest({ body: createProductBodySchema }), asyncHandler(productController.createProduct))
    .all(methodNotAllowed);

router
    .route('/products/summary')
    .get(validateRequest({ query: productSummaryQuerySchema }), asyncHandler(productController.getProductSummary))
    .all(methodNotAllowed);

router
    .route('/products/export')
    .get(asyncHandler(productController.exportProducts))
    .all(methodNotAllowed);

router
    .route('/products/import')
    .post(upload.single('file'), validateUploadedFile('file'), asyncHandler(productController.importProducts))
    .all(methodNotAllowed);

router
    .route('/products/bulk')
    .post(validateRequest({ body: bulkCreateProductsBodySchema }), asyncHandler(productController.bulkCreateProducts))
    .all(methodNotAllowed);

router
    .route('/products/validate-barcodes')
    .post(validateRequest({ body: validateBarcodesBodySchema }), asyncHandler(productController.validateBarcodes))
    .all(methodNotAllowed);

router
    .route('/products/id/:id')
    .get(validateRequest({ params: productIdParamSchema }), asyncHandler(productController.getProductById))
    .all(methodNotAllowed);

router
    .route('/products/:id/history')
    .get(validateRequest({ params: productIdParamSchema, query: productHistoryQuerySchema }), asyncHandler(productController.getProductHistory))
    .all(methodNotAllowed);

// Keep barcode lookup as GET-only without `.all(methodNotAllowed)` because this
// path shape overlaps with `/products/:id` mutation routes.
router.get('/products/:barcode', validateRequest({ params: barcodeParamSchema }), asyncHandler(productController.getProductByBarcode));

router
    .route('/products/:id')
    .put(validateRequest({ params: productIdParamSchema, body: updateProductBodySchema }), asyncHandler(productController.updateProduct))
    .delete(validateRequest({ params: productIdParamSchema }), asyncHandler(productController.deleteProduct));

router
    .route('/batches')
    .post(validateRequest({ body: addBatchBodySchema }), asyncHandler(productController.addBatch))
    .all(methodNotAllowed);

router
    .route('/batches/:id')
    .put(validateRequest({ params: batchIdParamSchema, body: updateBatchBodySchema }), asyncHandler(productController.updateBatch))
    .delete(validateRequest({ params: batchIdParamSchema }), asyncHandler(productController.deleteBatch))
    .all(methodNotAllowed);

module.exports = router;
