import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import saleService = require('./sale.service');
import { createHttpError } from '../../shared/error/appError';
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { paramValue } from '../../shared/utils/requestParams';

const processSale = async (req: Request, res: Response) => {
  const sale = await saleService.processSale(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    { saleId: sale.id, sale },
    'Sale processed successfully',
    { format: 'merge' }
  );
};

const getSaleById = async (req: Request, res: Response) => {
  const id = paramValue(req.params.id);
  const sale = await saleService.getSaleById(id);
  if (!sale) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'Sale not found', { error: 'Sale not found' });
  }

  return sendSuccessResponse(res, StatusCodes.OK, sale, 'Sale fetched successfully', {
    format: 'merge',
  });
};

const processReturn = async (req: Request, res: Response) => {
  const saleId = paramValue(req.params.id);
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
