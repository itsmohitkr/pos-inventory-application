import { StatusCodes } from 'http-status-codes';
import purchaseService = require('./purchase.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const createPurchase = async (req, res) => {
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

const getPurchases = async (req, res) => {
  const purchases = await purchaseService.getPurchases(req.query);
  return sendSuccessResponse(res, StatusCodes.OK, purchases, 'Purchases fetched successfully', {
    format: 'raw',
  });
};

const deletePurchase = async (req, res) => {
  await purchaseService.deletePurchase(req.params.id);
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

const updatePurchase = async (req, res) => {
  const purchase = await purchaseService.updatePurchase(req.params.id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, purchase, 'Purchase updated successfully', {
    format: 'raw',
  });
};

const addPayment = async (req, res) => {
  const payment = await purchaseService.addPayment(req.params.id, req.body);
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

const updatePayment = async (req, res) => {
  const payment = await purchaseService.updatePayment(req.params.id, req.body);
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

const deletePayment = async (req, res) => {
  await purchaseService.deletePayment(req.params.id);
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
