import { StatusCodes } from 'http-status-codes';
import customerService = require('./customer.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const findOrCreate = async (req, res) => {
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

const getAllCustomers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order || 'desc';
  
  const result = await customerService.getAllCustomers({ page, limit, search, sortBy, order });
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Customers fetched', { format: 'raw' });
};

const getCustomerById = async (req, res) => {
  const customer = await customerService.getCustomerById(parseInt(req.params.id));
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer fetched', { format: 'raw' });
};

const updateCustomer = async (req, res) => {
  const { name, phone } = req.body;
  const customer = await customerService.updateCustomer(parseInt(req.params.id), { name, phone });
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer updated', { format: 'raw' });
};


const getByBarcode = async (req, res) => {
  const customer = await customerService.findByBarcode(req.params.barcode);
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
};

const getByPhone = async (req, res) => {
  const customer = await customerService.findByPhone(req.params.phone);
  return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
};

const getPurchaseHistory = async (req, res) => {
  const result = await customerService.getCustomerPurchaseHistory(parseInt(req.params.id));
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
