import express = require('express');
import multer = require('multer');
import productController = require('./product.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import validateUploadedFile = require('../../shared/middleware/validateUploadedFile');
import handleUploadErrors = require('../../shared/middleware/handleUploadErrors');
import {
  GetAllProductsSchema,
  CreateProductSchema,
  GetProductSummarySchema,
  ValidateBarcodesSchema,
  GetProductByIdSchema,
  GetProductHistorySchema,
  GetProductByBarcodeSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  AddBatchSchema,
  UpdateBatchSchema,
  DeleteBatchSchema,
} from './product.validation';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router
  .route('/products')
  .get(
    validateRequest(GetAllProductsSchema),
    productController.getAllProducts
  )
  .post(
    validateRequest(CreateProductSchema),
    productController.createProduct
  )
  .all(methodNotAllowed);

router
  .route('/products/summary')
  .get(
    validateRequest(GetProductSummarySchema),
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
  .route('/products/validate-barcodes')
  .post(
    validateRequest(ValidateBarcodesSchema),
    productController.validateBarcodes
  )
  .all(methodNotAllowed);

router
  .route('/products/id/:id')
  .get(
    validateRequest(GetProductByIdSchema),
    productController.getProductById
  )
  .all(methodNotAllowed);

router
  .route('/products/:id/history')
  .get(
    validateRequest(GetProductHistorySchema),
    productController.getProductHistory
  )
  .all(methodNotAllowed);

// Keep barcode lookup as GET-only without `.all(methodNotAllowed)` because this
// path shape overlaps with `/products/:id` mutation routes.
router.get(
  '/products/:barcode',
  validateRequest(GetProductByBarcodeSchema),
  productController.getProductByBarcode
);

router
  .route('/products/:id')
  .put(
    validateRequest(UpdateProductSchema),
    productController.updateProduct
  )
  .delete(
    validateRequest(DeleteProductSchema),
    productController.deleteProduct
  );

router
  .route('/batches')
  .post(validateRequest(AddBatchSchema), productController.addBatch)
  .all(methodNotAllowed);

router
  .route('/batches/:id')
  .put(
    validateRequest(UpdateBatchSchema),
    productController.updateBatch
  )
  .delete(
    validateRequest(DeleteBatchSchema),
    productController.deleteBatch
  )
  .all(methodNotAllowed);

export = router;
