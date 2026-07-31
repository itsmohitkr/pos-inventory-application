import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import categorySaleService = require('./category-sale.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';
import { paramValue } from '../../shared/utils/requestParams';

const createCategorySale = async (req: Request, res: Response) => {
  const sale = await categorySaleService.createCategorySale(req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.CREATED,
    sale,
    'Category sale created successfully',
    { format: 'raw' }
  );
};

const getAllCategorySales = async (_req: Request, res: Response) => {
  const sales = await categorySaleService.getAllCategorySales();
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    sales,
    'Category sales fetched successfully',
    { format: 'raw' }
  );
};

const getCategorySaleById = async (req: Request, res: Response) => {
  const sale = await categorySaleService.getCategorySaleById(paramValue(req.params.id));
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    sale,
    'Category sale fetched successfully',
    { format: 'raw' }
  );
};

const updateCategorySale = async (req: Request, res: Response) => {
  const sale = await categorySaleService.updateCategorySale(paramValue(req.params.id), req.body);
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    sale,
    'Category sale updated successfully',
    { format: 'raw' }
  );
};

const toggleCategorySaleStatus = async (req: Request, res: Response) => {
  const sale = await categorySaleService.toggleCategorySaleStatus(
    paramValue(req.params.id),
    req.body.status
  );
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    sale,
    'Category sale status updated successfully',
    { format: 'raw' }
  );
};

const deleteCategorySale = async (req: Request, res: Response) => {
  await categorySaleService.deleteCategorySale(paramValue(req.params.id));
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    null,
    'Category sale deleted successfully',
    { format: 'raw' }
  );
};

const previewCategorySale = async (req: Request, res: Response) => {
  const category = String(req.query.category || '');
  const discountPercentage = Number(req.query.discountPercentage || 0);
  const previewItems = await categorySaleService.previewCategorySaleProducts(
    category,
    discountPercentage
  );
  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    previewItems,
    'Category sale preview generated successfully',
    { format: 'raw' }
  );
};

export = {
  createCategorySale: asyncHandler(createCategorySale),
  getAllCategorySales: asyncHandler(getAllCategorySales),
  getCategorySaleById: asyncHandler(getCategorySaleById),
  updateCategorySale: asyncHandler(updateCategorySale),
  toggleCategorySaleStatus: asyncHandler(toggleCategorySaleStatus),
  deleteCategorySale: asyncHandler(deleteCategorySale),
  previewCategorySale: asyncHandler(previewCategorySale),
};
