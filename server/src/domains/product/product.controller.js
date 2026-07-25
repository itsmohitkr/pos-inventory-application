const { StatusCodes } = require('http-status-codes');
const productService = require('./product.service');
const { createHttpError } = require('../../shared/error/appError');
const asyncHandler = require('../../shared/error/asyncHandler');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const getAllProducts = async (req, res) => {
  const {
    page = '1',
    pageSize = '25',
    search = '',
    category = 'all',
    sortBy = 'name',
    sortOrder = 'asc',
    includeBatches = 'false',
  } = req.query;

  if (includeBatches === 'true') {
    const data = await productService.getAllProductsWithBatches({ search, category });
    return sendSuccessResponse(res, StatusCodes.OK, { data }, 'Products fetched successfully', {
      format: 'merge',
    });
  }

  const result = await productService.getAllProducts({
    page: Number(page),
    pageSize: Number(pageSize),
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
        page: Number(page),
        pageSize: Number(pageSize),
        total: result.total,
      },
    },
    'Products fetched successfully',
    { format: 'merge' }
  );
};

const getProductSummary = async (req, res) => {
  const { search = '', category = 'all' } = req.query;
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

const getProductById = async (req, res) => {
  const { id } = req.params;
  const result = await productService.getProductById(id);
  if (!result) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

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

const getProductByBarcode = async (req, res) => {
  const { barcode } = req.params;
  const result = await productService.getProductByBarcode(barcode);
  if (!result) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
      error: 'Product not found',
    });
  }

  return sendSuccessResponse(res, StatusCodes.OK, result, 'Product fetched successfully', {
    format: 'merge',
  });
};

const getProductHistory = async (req, res) => {
  const { id } = req.params;
  const { range = 'today', startDate, endDate } = req.query;
  const data = await productService.getProductHistory(id, { range, startDate, endDate });
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

const createProduct = async (req, res) => {
  const result = await productService.createOrUpdateProduct(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { id: result.id },
    'Product/Batch processed successfully',
    { format: 'merge' }
  );
};

const addBatch = async (req, res) => {
  const batch = await productService.addBatch(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, { id: batch.id }, 'Batch added', {
    format: 'merge',
  });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await productService.updateProduct(id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, product, 'Product updated successfully', {
    format: 'merge',
  });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  await productService.deleteProduct(id);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Product deleted successfully');
};

const updateBatch = async (req, res) => {
  const { id } = req.params;
  const batch = await productService.updateBatch(id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, batch, 'Batch updated successfully', {
    format: 'merge',
  });
};

const deleteBatch = async (req, res) => {
  const { id } = req.params;
  await productService.deleteBatch(id);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Batch deleted successfully');
};

const exportProducts = async (req, res) => {
  const csv = await productService.exportProducts();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send(csv);
};

const importProducts = async (req, res) => {
  const csvData = req.file.buffer.toString('utf-8');
  const result = await productService.importProducts(csvData);
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Products imported successfully', {
    format: 'merge',
  });
};

const validateBarcodes = async (req, res) => {
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

const bulkCreateProducts = async (req, res) => {
  const { products } = req.body;
  const result = await productService.bulkCreateProducts(products);
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Products created successfully', {
    format: 'merge',
  });
};

module.exports = {
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
