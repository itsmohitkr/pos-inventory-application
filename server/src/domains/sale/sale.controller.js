const { StatusCodes } = require('http-status-codes');
const saleService = require('./sale.service');
const { createHttpError } = require('../../shared/error/appError');
const asyncHandler = require('../../shared/error/asyncHandler');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const processSale = async (req, res) => {
  const sale = await saleService.processSale(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    { saleId: sale.id, sale },
    'Sale processed successfully',
    { format: 'merge' }
  );
};

const getSaleById = async (req, res) => {
  const { id } = req.params;
  const sale = await saleService.getSaleById(id);
  if (!sale) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Sale not found', { error: 'Sale not found' });
  }

  return sendSuccessResponse(res, StatusCodes.OK, sale, 'Sale fetched successfully', {
    format: 'merge',
  });
};

const processReturn = async (req, res) => {
  const { id: saleId } = req.params;
  const { items } = req.body;

  const result = await saleService.processReturn(saleId, items);
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Return processed successfully', {
    format: 'merge',
  });
};

module.exports = {
  processSale: asyncHandler(processSale),
  getSaleById: asyncHandler(getSaleById),
  processReturn: asyncHandler(processReturn),
};
