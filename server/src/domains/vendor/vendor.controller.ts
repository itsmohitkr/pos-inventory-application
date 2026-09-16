import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import vendorService = require('./vendor.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { paramInt, queryCount, queryStrOr } from '../../shared/utils/requestParams';

const findOrCreate = async (req: Request, res: Response) => {
  const { name, phone, address } = req.body;
  const result = await vendorService.findOrCreateVendor({ name, phone, address });
  return sendSuccessResponse(
    res,
    result.isNew ? StatusCodes.CREATED : StatusCodes.OK,
    result,
    result.isNew ? 'Vendor created' : 'Vendor found',
    { format: 'raw' }
  );
};

const getAllVendors = async (req: Request, res: Response) => {
  const page = queryCount(req.query.page, 1);
  const limit = queryCount(req.query.limit, 50);
  const search = queryStrOr(req.query.search, '');

  const result = await vendorService.getAllVendors({ page, limit, search });
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Vendors fetched', { format: 'raw' });
};

const getVendorById = async (req: Request, res: Response) => {
  const result = await vendorService.getVendorById(paramInt(req.params.id));
  return sendSuccessResponse(res, StatusCodes.OK, result, 'Vendor fetched', { format: 'raw' });
};

const updateVendor = async (req: Request, res: Response) => {
  const { name, phone, address } = req.body;
  const vendor = await vendorService.updateVendor(paramInt(req.params.id), { name, phone, address });
  return sendSuccessResponse(res, StatusCodes.OK, vendor, 'Vendor updated', { format: 'raw' });
};

export = {
  findOrCreate: asyncHandler(findOrCreate),
  getAllVendors: asyncHandler(getAllVendors),
  getVendorById: asyncHandler(getVendorById),
  updateVendor: asyncHandler(updateVendor),
};
