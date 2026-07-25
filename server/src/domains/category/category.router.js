const express = require('express');
const categoryController = require('./category.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} = require('./category.validation');

const router = express.Router();

router
  .route('/categories')
  .get(categoryController.getCategories)
  .post(validateRequest({ body: createCategoryBodySchema }), categoryController.createCategory)
  .all(methodNotAllowed);
router
  .route('/categories/:id')
  .put(
    validateRequest({
      params: categoryIdParamSchema,
      body: updateCategoryBodySchema,
    }),
    categoryController.updateCategory
  )
  .delete(validateRequest({ params: categoryIdParamSchema }), categoryController.deleteCategory)
  .all(methodNotAllowed);

module.exports = router;
