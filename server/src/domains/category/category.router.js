const express = require('express');
const categoryController = require('./category.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/categories').get(asyncHandler(categoryController.getCategories)).post(asyncHandler(categoryController.createCategory)).all(methodNotAllowed);
router.route('/categories/:id').put(asyncHandler(categoryController.updateCategory)).delete(asyncHandler(categoryController.deleteCategory)).all(methodNotAllowed);

module.exports = router;
