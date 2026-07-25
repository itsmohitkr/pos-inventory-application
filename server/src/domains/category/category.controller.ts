import { StatusCodes } from 'http-status-codes';
import categoryService = require('./category.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const getCategories = async (_req, res) => {
  const data = await categoryService.getCategoryTree();
  return sendSuccessResponse(res, StatusCodes.OK, data, 'Categories fetched successfully');
};

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccessResponse(res, StatusCodes.CREATED, category, 'Category saved successfully');
};
 
const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccessResponse(res, StatusCodes.OK, category, 'Category updated successfully');
};

const deleteCategory = async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Category deleted');
};

export = {
  getCategories: asyncHandler(getCategories),
  createCategory: asyncHandler(createCategory),
  updateCategory: asyncHandler(updateCategory),
  deleteCategory: asyncHandler(deleteCategory),
};
