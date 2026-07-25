const { StatusCodes } = require('http-status-codes');
const categoryService = require('./category.service');
const asyncHandler = require('../../shared/error/asyncHandler');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

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

module.exports = {
  getCategories: asyncHandler(getCategories),
  createCategory: asyncHandler(createCategory),
  updateCategory: asyncHandler(updateCategory),
  deleteCategory: asyncHandler(deleteCategory),
};
