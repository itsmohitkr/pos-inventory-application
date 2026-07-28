import express = require('express');
import authController = require('./auth.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import { requireAdmin } from '../../shared/middleware/requireAdmin';
import {
  userIdParamSchema,
  profileQuerySchema,
  loginBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
  changePasswordBodySchema,
  verifyAdminBodySchema,
  wipeDatabaseBodySchema,
  completeOnboardingBodySchema,
} from './auth.validation';

const router = express.Router();

router
  .route('/login')
  .post(validateRequest({ body: loginBodySchema }), authController.login)
  .all(methodNotAllowed);
router
  .route('/profile')
  .get(validateRequest({ query: profileQuerySchema }), authController.getProfile)
  .all(methodNotAllowed);
// The three routes below grant durable privilege — a write here survives
// logout, restart and reinstall — so they require a live admin elevation
// token. See shared/middleware/requireAdmin.ts for why the rest of this API
// stays unauthenticated.
router
  .route('/users')
  .get(authController.getAllUsers)
  .post(
    requireAdmin,
    validateRequest({ body: createUserBodySchema }),
    authController.createUser
  )
  .all(methodNotAllowed);
router
  .route('/users/:id')
  .put(
    requireAdmin,
    validateRequest({ params: userIdParamSchema, body: updateUserBodySchema }),
    authController.updateUser
  )
  .delete(
    requireAdmin,
    validateRequest({ params: userIdParamSchema }),
    authController.deleteUser
  )
  .all(methodNotAllowed);
router
  .route('/users/:id/change-password')
  .put(
    validateRequest({ params: userIdParamSchema, body: changePasswordBodySchema }),
    authController.changePassword
  )
  .all(methodNotAllowed);
router
  .route('/wipe-database')
  .post(
    validateRequest({ body: wipeDatabaseBodySchema }),
    authController.wipeDatabase
  )
  .all(methodNotAllowed);
router
  .route('/verify-admin')
  .post(validateRequest({ body: verifyAdminBodySchema }), authController.verifyAdmin)
  .all(methodNotAllowed);
router
  .route('/complete-onboarding')
  .post(
    validateRequest({ body: completeOnboardingBodySchema }),
    authController.completeOnboarding
  )
  .all(methodNotAllowed);

export = router;
