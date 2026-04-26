const { StatusCodes } = require('http-status-codes');
const customerService = require('./customer.service');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');
const logger = require('../../shared/utils/logger');

const mapCustomerError = (error) => {
  throw toAppError(error, {
    defaultStatus: StatusCodes.BAD_REQUEST,
    notFoundMessages: ['Customer not found'],
  });
};

const findOrCreate = async (req, res) => {
  try {
    const { phone, name } = req.body;
    const result = await customerService.findOrCreateCustomer({ phone, name });
    return sendSuccessResponse(
      res,
      result.isNew ? StatusCodes.CREATED : StatusCodes.OK,
      result,
      result.isNew ? 'Customer created' : 'Customer found',
      { format: 'raw' }
    );
  } catch (error) {
    logger.error({ err: error.message }, 'Error in findOrCreate customer');
    return mapCustomerError(error);
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const result = await customerService.getAllCustomers({ page, limit, search });
    return sendSuccessResponse(res, StatusCodes.OK, result, 'Customers fetched', { format: 'raw' });
  } catch (error) {
    return mapCustomerError(error);
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(parseInt(req.params.id));
    return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer fetched', { format: 'raw' });
  } catch (error) {
    return mapCustomerError(error);
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = await customerService.updateCustomer(parseInt(req.params.id), { name, phone });
    return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer updated', { format: 'raw' });
  } catch (error) {
    logger.error({ err: error.message }, 'Error updating customer');
    return mapCustomerError(error);
  }
};


const getByBarcode = async (req, res) => {
  try {
    const customer = await customerService.findByBarcode(req.params.barcode);
    return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
  } catch (error) {
    return mapCustomerError(error);
  }
};

const getByPhone = async (req, res) => {
  try {
    const customer = await customerService.findByPhone(req.params.phone);
    return sendSuccessResponse(res, StatusCodes.OK, customer, 'Customer found', { format: 'raw' });
  } catch (error) {
    return mapCustomerError(error);
  }
};

const getPurchaseHistory = async (req, res) => {
  try {
    const result = await customerService.getCustomerPurchaseHistory(parseInt(req.params.id));
    return sendSuccessResponse(res, StatusCodes.OK, result, 'Purchase history fetched', { format: 'raw' });
  } catch (error) {
    return mapCustomerError(error);
  }
};

module.exports = {
  findOrCreate,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getByBarcode,
  getByPhone,
  getPurchaseHistory,
};
