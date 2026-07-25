import { StatusCodes } from 'http-status-codes';
import looseSaleService = require('./loose-sale.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const createLooseSale = async (req, res) => {
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

const getLooseSalesReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await looseSaleService.getLooseSalesReport({ startDate, endDate });
  return sendSuccessResponse(res, StatusCodes.OK, data, 'Loose sales fetched successfully', {
    format: 'raw',
  });
};

const deleteLooseSale = async (req, res) => {
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
