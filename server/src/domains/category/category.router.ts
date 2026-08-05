import express = require('express');
import categoryController = require('./category.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from './category.validation';

const router = express.Router();

router
  .route('/categories')
  .get(categoryController.getCategories)
  .post(validateRequest(CreateCategorySchema), categoryController.createCategory)
  .all(methodNotAllowed);
router
  .route('/categories/:id')
  .put(validateRequest(UpdateCategorySchema), categoryController.updateCategory)
  .delete(validateRequest(DeleteCategorySchema), categoryController.deleteCategory)
  .all(methodNotAllowed);

export = router;
