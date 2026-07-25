const express = require('express');
const multer = require('multer');
const productController = require('./product.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const validateUploadedFile = require('../../shared/middleware/validateUploadedFile');
const handleUploadErrors = require('../../shared/middleware/handleUploadErrors');
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
  bulkCreateProductsBodySchema,
} = require('./product.validation');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router
  .route('/products')
  .get(
    validateRequest({ query: productQuerySchema }),
    productController.getAllProducts
  )
  .post(
    validateRequest({ body: createProductBodySchema }),
    productController.createProduct
  )
  .all(methodNotAllowed);

router
  .route('/products/summary')
  .get(
    validateRequest({ query: productSummaryQuerySchema }),
    productController.getProductSummary
  )
  .all(methodNotAllowed);

router
  .route('/products/export')
  .get(productController.exportProducts)
  .all(methodNotAllowed);

router
  .route('/products/import')
  .post(
    handleUploadErrors(upload.single('file')),
    validateUploadedFile('file'),
    productController.importProducts
  )
  .all(methodNotAllowed);

router
  .route('/products/bulk')
  .post(
    validateRequest({ body: bulkCreateProductsBodySchema }),
    productController.bulkCreateProducts
  )
  .all(methodNotAllowed);

router
  .route('/products/validate-barcodes')
  .post(
    validateRequest({ body: validateBarcodesBodySchema }),
    productController.validateBarcodes
  )
  .all(methodNotAllowed);

router
  .route('/products/id/:id')
  .get(
    validateRequest({ params: productIdParamSchema }),
    productController.getProductById
  )
  .all(methodNotAllowed);

router
  .route('/products/:id/history')
  .get(
    validateRequest({ params: productIdParamSchema, query: productHistoryQuerySchema }),
    productController.getProductHistory
  )
  .all(methodNotAllowed);

// Keep barcode lookup as GET-only without `.all(methodNotAllowed)` because this
// path shape overlaps with `/products/:id` mutation routes.
router.get(
  '/products/:barcode',
  validateRequest({ params: barcodeParamSchema }),
  productController.getProductByBarcode
);

router
  .route('/products/:id')
  .put(
    validateRequest({ params: productIdParamSchema, body: updateProductBodySchema }),
    productController.updateProduct
  )
  .delete(
    validateRequest({ params: productIdParamSchema }),
    productController.deleteProduct
  );

router
  .route('/batches')
  .post(validateRequest({ body: addBatchBodySchema }), productController.addBatch)
  .all(methodNotAllowed);

router
  .route('/batches/:id')
  .put(
    validateRequest({ params: batchIdParamSchema, body: updateBatchBodySchema }),
    productController.updateBatch
  )
  .delete(
    validateRequest({ params: batchIdParamSchema }),
    productController.deleteBatch
  )
  .all(methodNotAllowed);

module.exports = router;
