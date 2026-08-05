import { Router } from 'express';
import categorySaleController = require('./category-sale.controller');
import { validateRequest } from '../../shared/middleware/validateRequest';
import {
  CreateCategorySaleSchema,
  UpdateCategorySaleSchema,
  DeleteCategorySaleSchema,
  ToggleCategorySaleStatusSchema,
  PreviewCategorySaleSchema,
} from './category-sale.validation';

const router = Router();

router
  .route('/')
  .post(validateRequest(CreateCategorySaleSchema), categorySaleController.createCategorySale)
  .get(categorySaleController.getAllCategorySales);

router.get(
  '/preview',
  validateRequest(PreviewCategorySaleSchema),
  categorySaleController.previewCategorySale
);

router
  .route('/:id')
  .get(categorySaleController.getCategorySaleById)
  .put(validateRequest(UpdateCategorySaleSchema), categorySaleController.updateCategorySale)
  .delete(validateRequest(DeleteCategorySaleSchema), categorySaleController.deleteCategorySale);

router.patch(
  '/:id/status',
  validateRequest(ToggleCategorySaleStatusSchema),
  categorySaleController.toggleCategorySaleStatus
);

export = router;
