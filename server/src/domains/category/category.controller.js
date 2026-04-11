const { StatusCodes } = require('http-status-codes');
const categoryService = require('./category.service');
const toAppError = require('../../shared/error/toAppError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const mapCategoryError = (error) => {
    throw toAppError(error, {
        defaultStatus: StatusCodes.INTERNAL_SERVER_ERROR,
        notFoundMessages: ['Category not found'],
        badRequestMessages: ['Invalid category name']
    });
};

const getCategories = async (_req, res) => {
    const data = await categoryService.getCategoryTree();
    return sendSuccessResponse(res, StatusCodes.OK, data, 'Categories fetched successfully');
};

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        return sendSuccessResponse(res, StatusCodes.CREATED, category, 'Category saved successfully');
    } catch (error) {
        return mapCategoryError(error);
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        return sendSuccessResponse(res, StatusCodes.OK, category, 'Category updated successfully');
    } catch (error) {
        return mapCategoryError(error);
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Category deleted');
    } catch (error) {
        return mapCategoryError(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
