import express = require('express');
import categoryController = require('./category.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from './category.validation';

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

export = router;
