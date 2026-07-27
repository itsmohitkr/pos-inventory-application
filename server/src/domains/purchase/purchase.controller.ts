import type { Request, Response } from 'express';
import { paramInt } from '../../shared/utils/requestParams';
import { StatusCodes } from 'http-status-codes';
import purchaseService = require('./purchase.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const createPurchase = async (req: Request, res: Response) => {
  const purchase = await purchaseService.createPurchase(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    purchase,
    'Purchase created successfully',
    {
      format: 'raw',
    }
  );
};

const getPurchases = async (req: Request, res: Response) => {
  const purchases = await purchaseService.getPurchases(req.query);
  return sendSuccessResponse(res, StatusCodes.OK, purchases, 'Purchases fetched successfully', {
    format: 'raw',
  });
};

const deletePurchase = async (req: Request, res: Response) => {
  await purchaseService.deletePurchase(paramInt(req.params.id));
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { message: 'Purchase deleted successfully' },
    'Purchase deleted successfully',
    {
      format: 'raw',
    }
  );
};

const updatePurchase = async (req: Request, res: Response) => {
  const purchase = await purchaseService.updatePurchase(paramInt(req.params.id), req.body);
  return sendSuccessResponse(res, StatusCodes.OK, purchase, 'Purchase updated successfully', {
    format: 'raw',
  });
};

const addPayment = async (req: Request, res: Response) => {
  const payment = await purchaseService.addPayment(paramInt(req.params.id), req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    payment,
    'Purchase payment added successfully',
    {
      format: 'raw',
    }
  );
};

const updatePayment = async (req: Request, res: Response) => {
  const payment = await purchaseService.updatePayment(paramInt(req.params.id), req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    payment,
    'Purchase payment updated successfully',
    {
      format: 'raw',
    }
  );
};

const deletePayment = async (req: Request, res: Response) => {
  await purchaseService.deletePayment(paramInt(req.params.id));
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { message: 'Payment deleted successfully' },
    'Payment deleted successfully',
    {
      format: 'raw',
    }
  );
};
export = {
  createPurchase: asyncHandler(createPurchase),
  getPurchases: asyncHandler(getPurchases),
  deletePurchase: asyncHandler(deletePurchase),
  updatePurchase: asyncHandler(updatePurchase),
  addPayment: asyncHandler(addPayment),
  updatePayment: asyncHandler(updatePayment),
  deletePayment: asyncHandler(deletePayment),
};
