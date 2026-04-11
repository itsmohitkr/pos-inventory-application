const categoryService = require('./category.service');
const { createHttpError } = require('../../shared/error/appError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const throwCategoryError = (error) => {
    if (error?.statusCode) {
        throw error;
    }

    if (error?.message === 'Category not found') {
        throw createHttpError(404, error.message, { error: error.message });
    }

    if (error?.message === 'Invalid category name') {
        throw createHttpError(400, error.message, { error: error.message });
    }

    throw createHttpError(500, error?.message || 'Failed to process category', {
        error: error?.message || 'Failed to process category'
    });
};

const getCategories = async (_req, res) => {
    const data = await categoryService.getCategoryTree();
    return sendSuccessResponse(res, 200, data, 'Categories fetched successfully');
};

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        return sendSuccessResponse(res, 200, category, 'Category saved successfully');
    } catch (error) {
        return throwCategoryError(error);
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        return sendSuccessResponse(res, 200, category, 'Category updated successfully');
    } catch (error) {
        return throwCategoryError(error);
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        return sendSuccessResponse(res, 200, undefined, 'Category deleted');
    } catch (error) {
        return throwCategoryError(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
