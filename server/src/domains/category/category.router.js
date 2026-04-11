const express = require("express");
const categoryController = require("./category.controller");
const asyncHandler = require("../../shared/error/asyncHandler");
const methodNotAllowed = require("../../shared/error/methodNotAllowed");
const { validateRequest } = require("../../shared/middleware/validateRequest");
const {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} = require("./category.validation");

const router = express.Router();

router
  .route("/categories")
  .get(asyncHandler(categoryController.getCategories))
  .post(
    validateRequest({ body: createCategoryBodySchema }),
    asyncHandler(categoryController.createCategory),
  )
  .all(methodNotAllowed);
router
  .route("/categories/:id")
  .put(
    validateRequest({
      params: categoryIdParamSchema,
      body: updateCategoryBodySchema,
    }),
    asyncHandler(categoryController.updateCategory),
  )
  .delete(
    validateRequest({ params: categoryIdParamSchema }),
    asyncHandler(categoryController.deleteCategory),
  )
  .all(methodNotAllowed);

module.exports = router;
