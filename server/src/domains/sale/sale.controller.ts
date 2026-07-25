import { StatusCodes } from 'http-status-codes';
import saleService = require('./sale.service');
import { createHttpError } from '../../shared/error/appError';
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

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

export = {
  processSale: asyncHandler(processSale),
  getSaleById: asyncHandler(getSaleById),
  processReturn: asyncHandler(processReturn),
};
