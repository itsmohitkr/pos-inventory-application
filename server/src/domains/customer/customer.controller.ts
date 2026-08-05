import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import customerService = require('./customer.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { paramInt, paramStr, queryCount, queryStrOr } from '../../shared/utils/requestParams';

const findOrCreate = async (req: Request, res: Response) => {
  const { phone, name } = req.body;
  const result = await customerService.findOrCreateCustomer({ phone, name });
  return sendSuccessResponse(
    res,
    result.isNew ? StatusCodes.CREATED : StatusCodes.OK,
    result,
    result.isNew ? 'Customer created' : 'Customer found',
    { format: 'raw' }
  );
};

const getAllCustomers = async (req: Request, res: Response) => {
  const page = queryCount(req.query.page, 1);
  const limit = queryCount(req.query.limit, 50);
  const search = queryStrOr(req.query.search, '');
  const sortBy = queryStrOr(req.query.sortBy, 'createdAt');
  const order = queryStrOr(req.query.order, 'desc');
  
  const result = await customerService.getAllCustomers({ page, limit, search, sortBy, order });
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Customers fetched', { format: 'raw' });
};

const getCustomerById = async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(paramInt(req.params.id));
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer fetched', { format: 'raw' });
};

const updateCustomer = async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  const customer = await customerService.updateCustomer(paramInt(req.params.id), { name, phone });
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer updated', { format: 'raw' });
};


const getByBarcode = async (req: Request, res: Response) => {
  const customer = await customerService.findByBarcode(paramStr(req.params.barcode));
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
};

const getByPhone = async (req: Request, res: Response) => {
  const customer = await customerService.findByPhone(paramStr(req.params.phone));
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
};

const getPurchaseHistory = async (req: Request, res: Response) => {
  const result = await customerService.getCustomerPurchaseHistory(paramInt(req.params.id));
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Purchase history fetched', { format: 'raw' });
};

export = {
  findOrCreate: asyncHandler(findOrCreate),
  getAllCustomers: asyncHandler(getAllCustomers),
  getCustomerById: asyncHandler(getCustomerById),
  updateCustomer: asyncHandler(updateCustomer),
  getByBarcode: asyncHandler(getByBarcode),
  getByPhone: asyncHandler(getByPhone),
  getPurchaseHistory: asyncHandler(getPurchaseHistory),
};
