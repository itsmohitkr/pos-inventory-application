const { StatusCodes } = require('http-status-codes');
const saleService = require('./sale.service');
const { createHttpError } = require('../../shared/error/appError');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const mapSaleError = (error, defaultStatus = StatusCodes.BAD_REQUEST) => {
  if (error?.statusCode) {
    throw error;
  }

  throw toAppError(error, {
    defaultStatus,
    notFoundMessages: ['Sale not found', 'Sale item'],
    badRequestMessages: ['Insufficient stock', 'Cannot return more than sold quantity'],
  });
};

const processSale = async (req, res) => {
  try {
    const sale = await saleService.processSale(req.body);
    return sendSuccessResponse(
      res,
      StatusCodes.CREATED,
      { saleId: sale.id, sale },
      'Sale processed successfully',
      { format: 'merge' }
    );
  } catch (error) {
    return mapSaleError(error);
  }
};

const getSaleById = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await saleService.getSaleById(id);
    if (!sale) {
      throw createHttpError(StatusCodes.NOT_FOUND, 'Sale not found', { error: 'Sale not found' });
    }

    return sendSuccessResponse(res, StatusCodes.OK, sale, 'Sale fetched successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapSaleError(error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const processReturn = async (req, res) => {
  const { id: saleId } = req.params;
  const { items } = req.body;

  try {
    const result = await saleService.processReturn(saleId, items);
    return sendSuccessResponse(res, StatusCodes.OK, result, 'Return processed successfully', {
      format: 'merge',
    });
  } catch (error) {
    return mapSaleError(error);
  }
};
module.exports = {
  processSale,
  getSaleById,
  processReturn,
};
