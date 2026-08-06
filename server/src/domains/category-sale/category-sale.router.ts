import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import categorySaleController = require('./category-sale.controller');
import { validateRequest } from '../../shared/middleware/validateRequest';
import { requireAdmin } from '../../shared/middleware/requireAdmin';
import {
  CreateCategorySaleSchema,
  UpdateCategorySaleSchema,
  DeleteCategorySaleSchema,
  ToggleCategorySaleStatusSchema,
  PreviewCategorySaleSchema,
} from './category-sale.validation';

const router = Router();

/**
 * Per-product discount overrides bypass the automatic margin floor (see
 * category-sale.service.ts / sale.service.ts) — a deliberate, conscious
 * pricing decision, so it requires the same live admin elevation token
 * every other durable-privilege route (user management) already requires.
 * Every other category-sale write stays unauthenticated, same as before.
 */
const requireAdminForOverrides = (req: Request, res: Response, next: NextFunction): void => {
  const hasOverrides = Array.isArray(req.body?.productOverrides) && req.body.productOverrides.length > 0;
  if (!hasOverrides) return next();
  return requireAdmin(req, res, next);
};

router
  .route('/')
  .post(
    requireAdminForOverrides,
    validateRequest(CreateCategorySaleSchema),
    categorySaleController.createCategorySale
  )
  .get(categorySaleController.getAllCategorySales);

router.get(
  '/preview',
  validateRequest(PreviewCategorySaleSchema),
  categorySaleController.previewCategorySale
);

router
  .route('/:id')
  .get(categorySaleController.getCategorySaleById)
  .put(
    requireAdminForOverrides,
    validateRequest(UpdateCategorySaleSchema),
    categorySaleController.updateCategorySale
  )
  .delete(validateRequest(DeleteCategorySaleSchema), categorySaleController.deleteCategorySale);

router.patch(
  '/:id/status',
  validateRequest(ToggleCategorySaleStatusSchema),
  categorySaleController.toggleCategorySaleStatus
);

export = router;
