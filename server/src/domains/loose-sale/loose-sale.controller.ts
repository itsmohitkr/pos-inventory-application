import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import looseSaleService = require('./loose-sale.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { queryStr } from '../../shared/utils/requestParams';

const createLooseSale = async (req: Request, res: Response) => {
  const { itemName, price } = req.body;
  const looseSale = await looseSaleService.createLooseSale({ itemName, price });
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    looseSale,
    'Loose sale created successfully',
    {
      format: 'raw',
    }
  );
};

const getLooseSalesReport = async (req: Request, res: Response) => {
  const startDate = queryStr(req.query.startDate);
  const endDate = queryStr(req.query.endDate);
  const data = await looseSaleService.getLooseSalesReport({ startDate, endDate });
  return sendSuccessResponse(res, StatusCodes.OK, data, 'Loose sales fetched successfully', {
    format: 'raw',
  });
};

const deleteLooseSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  await looseSaleService.deleteLooseSale(id);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { message: 'Loose sale deleted successfully' },
    'Loose sale deleted successfully',
    {
      format: 'raw',
    }
  );
};
export = {
  createLooseSale: asyncHandler(createLooseSale),
  getLooseSalesReport: asyncHandler(getLooseSalesReport),
  deleteLooseSale: asyncHandler(deleteLooseSale),
};
