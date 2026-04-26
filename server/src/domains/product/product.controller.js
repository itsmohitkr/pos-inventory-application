const { StatusCodes } = require('http-status-codes');
const productService = require('./product.service');
const { createHttpError } = require('../../shared/error/appError');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const mapProductError = (error, defaultStatus = StatusCodes.BAD_REQUEST) => {
  logger.error({ err: error.message, stack: error.stack }, 'Product controller error');

  if (error?.statusCode) {
    throw error;
  }

  if (error?.message?.startsWith('BARCODE_CONFLICT:')) {
    const message = error.message.replace('BARCODE_CONFLICT: ', '');
    throw createHttpError(StatusCodes.CONFLICT, message, { error: message });
  }

  throw toAppError(error, {
    defaultStatus,
    notFoundMessages: ['Product not found', 'Batch not found'],
    badRequestMessages: [
      'Invalid pricing values',
      'Selling price must be between cost price and MRP',
      'Invalid wholesale price',
      'No file uploaded',
      'Invalid request: barcodes array required',
      'Invalid request: products array required',
    ],
    foreignKeyMessage:
      'Cannot delete product because it is referenced by other records (e.g., sales, batches, or stock movements). Please remove related records first.',
  });
};

const getAllProducts = async (req, res) => {
  try {
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
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getProductSummary = async (req, res) => {
  try {
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
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
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
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getProductByBarcode = async (req, res) => {
  const { barcode } = req.params;
  try {
    const result = await productService.getProductByBarcode(barcode);
    if (!result) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Product not found', {
        error: 'Product not found',
      });
    }

    return sendSuccessResponse(res, StatusCodes.OK, result, 'Product fetched successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getProductHistory = async (req, res) => {
  const { id } = req.params;
  const { range = 'today', startDate, endDate } = req.query;
  try {
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
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const createProduct = async (req, res) => {
  try {
    const result = await productService.createOrUpdateProduct(req.body);
    return sendSuccessResponse(
      res,
      StatusCodes.OK,
      { id: result.id },
      'Product/Batch processed successfully',
      { format: 'merge' }
    );
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const addBatch = async (req, res) => {
  try {
    const batch = await productService.addBatch(req.body);
    return sendSuccessResponse(res, StatusCodes.CREATED, { id: batch.id }, 'Batch added', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productService.updateProduct(id, req.body);
    return sendSuccessResponse(res, StatusCodes.OK, product, 'Product updated successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await productService.deleteProduct(id);
    return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Product deleted successfully');
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const updateBatch = async (req, res) => {
  const { id } = req.params;
  try {
    const batch = await productService.updateBatch(id, req.body);
    return sendSuccessResponse(res, StatusCodes.OK, batch, 'Batch updated successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const deleteBatch = async (req, res) => {
  const { id } = req.params;
  try {
    await productService.deleteBatch(id);
    return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Batch deleted successfully');
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

const exportProducts = async (req, res) => {
  try {
    const csv = await productService.exportProducts();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csv);
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const importProducts = async (req, res) => {
  try {
    const csvData = req.file.buffer.toString('utf-8');
    const result = await productService.importProducts(csvData);
    return sendSuccessResponse(res, StatusCodes.OK, result, 'Products imported successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const validateBarcodes = async (req, res) => {
  try {
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
  } catch (error) {
    return mapProductError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;
    const result = await productService.bulkCreateProducts(products);
    return sendSuccessResponse(res, StatusCodes.OK, result, 'Products created successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapProductError(error, StatusCodes.BAD_REQUEST);
  }
};

module.exports = {
  getAllProducts,
  getProductSummary,
  getProductById,
  getProductByBarcode,
  createProduct,
  addBatch,
  updateProduct,
  deleteProduct,
  updateBatch,
  deleteBatch,
  exportProducts,
  importProducts,
  validateBarcodes,
  getProductHistory,
  bulkCreateProducts,
};
