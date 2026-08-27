import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import productService = require('./product.service');
import { createHttpError } from '../../shared/error/appError';
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { paramStr, paramValue, queryStr, queryStrOr, queryCount } from '../../shared/utils/requestParams';

const getAllProducts = async (req: Request, res: Response) => {
  const page = queryCount(req.query.page, 1);
  const pageSize = queryCount(req.query.pageSize, 25);
  const search = queryStrOr(req.query.search, '');
  const category = queryStrOr(req.query.category, 'all');
  const sortBy = queryStrOr(req.query.sortBy, 'name');
  const sortOrder = queryStrOr(req.query.sortOrder, 'asc');
  const includeBatches = queryStrOr(req.query.includeBatches, 'false');

  if (includeBatches === 'true') {
    const data = await productService.getAllProductsWithBatches({ search, category });
    return sendSuccessResponse(res, StatusCodes.OK, { data }, 'Products fetched successfully', {
      format: 'merge',
    });
  }

  const result = await productService.getAllProducts({
    page,
    pageSize,
    search,
    category,
    sortBy,
    sortOrder,
  });

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    {
      data: result.items,
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    },
    'Products fetched successfully',
    { format: 'merge' }
  );
};

const getProductSummary = async (req: Request, res: Response) => {
  const search = queryStrOr(req.query.search, '');
  const category = queryStrOr(req.query.category, 'all');
  const data = await productService.getProductSummary({ search, category });
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { data },
    'Product summary fetched successfully',
    {
      format: 'merge',
    }
  );
};

const getProductById = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const result = await productService.getProductById(id);

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { data: result },
    'Product fetched successfully',
    {
      format: 'merge',
    }
  );
};

const getProductByBarcode = async (req: Request, res: Response) => {
  const barcode = paramStr(req.params.barcode);
  const result = await productService.getProductByBarcode(barcode);

  return sendSuccessResponse(res, StatusCodes.OK, result, 'Product fetched successfully', {
    format: 'merge',
  });
};

const getProductHistory = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const range = queryStrOr(req.query.range, 'today');
  const startDate = queryStr(req.query.startDate);
  const endDate = queryStr(req.query.endDate);
  const page = queryCount(req.query.page, 1);
  const pageSize = queryCount(req.query.pageSize, 100);
  const data = await productService.getProductHistory(id, { range, startDate, endDate, page, pageSize });
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { data },
    'Product history fetched successfully',
    {
      format: 'merge',
    }
  );
};

const createProduct = async (req: Request, res: Response) => {
  const result = await productService.createOrUpdateProduct(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { id: result.id },
    'Product/Batch processed successfully',
    { format: 'merge' }
  );
};

const addBatch = async (req: Request, res: Response) => {
  const batch = await productService.addBatch(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, { id: batch.id }, 'Batch added', {
    format: 'merge',
  });
};

const updateProduct = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const product = await productService.updateProduct(id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, product, 'Product updated successfully', {
    format: 'merge',
  });
};

const deleteProduct = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  await productService.deleteProduct(id);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Product deleted successfully');
};

const updateBatch = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const batch = await productService.updateBatch(id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, batch, 'Batch updated successfully', {
    format: 'merge',
  });
};

const deleteBatch = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const { softDeleted } = await productService.deleteBatch(id);
  const message = softDeleted
    ? 'Batch retired — hidden from inventory, sales history preserved'
    : 'Batch deleted successfully';
  return sendSuccessResponse(res, StatusCodes.OK, { softDeleted }, message);
};

const exportProducts = async (req: Request, res: Response) => {
  const csv = await productService.exportProducts();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
};

const importProducts = async (req: Request, res: Response) => {
  // validateUploadedFile('file') runs before this on the router and already
  // rejects with 400 when req.file is missing; multer's own type still marks
  // it optional since that guarantee lives in another middleware.
  if (!req.file) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'No file uploaded', {
      error: 'No file uploaded',
    });
  }
  const csvData = req.file.buffer.toString('utf-8');
  const result = await productService.importProducts(csvData);
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Products imported successfully', {
    format: 'merge',
  });
};

const validateBarcodes = async (req: Request, res: Response) => {
  const { barcodes } = req.body;
  const existingBarcodes = await productService.validateBarcodes(barcodes);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { existingBarcodes },
    'Barcode validation completed',
    {
      format: 'merge',
    }
  );
};

const bulkCreateProducts = async (req: Request, res: Response) => {
  const { products } = req.body;
  const result = await productService.bulkCreateProducts(products);
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Products created successfully', {
    format: 'merge',
  });
};

export = {
  getAllProducts: asyncHandler(getAllProducts),
  getProductSummary: asyncHandler(getProductSummary),
  getProductById: asyncHandler(getProductById),
  getProductByBarcode: asyncHandler(getProductByBarcode),
  createProduct: asyncHandler(createProduct),
  addBatch: asyncHandler(addBatch),
  updateProduct: asyncHandler(updateProduct),
  deleteProduct: asyncHandler(deleteProduct),
  updateBatch: asyncHandler(updateBatch),
  deleteBatch: asyncHandler(deleteBatch),
  exportProducts: asyncHandler(exportProducts),
  importProducts: asyncHandler(importProducts),
  validateBarcodes: asyncHandler(validateBarcodes),
  getProductHistory: asyncHandler(getProductHistory),
  bulkCreateProducts: asyncHandler(bulkCreateProducts),
};
