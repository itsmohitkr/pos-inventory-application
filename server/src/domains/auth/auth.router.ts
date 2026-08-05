import express = require('express');
import authController = require('./auth.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import { requireAdmin } from '../../shared/middleware/requireAdmin';
import {
  LoginSchema,
  GetProfileSchema,
  CreateUserSchema,
  UpdateUserSchema,
  DeleteUserSchema,
  ChangePasswordSchema,
  WipeDatabaseSchema,
  VerifyAdminSchema,
  CompleteOnboardingSchema,
} from './auth.validation';

const router = express.Router();

router
  .route('/login')
  .post(validateRequest(LoginSchema), authController.login)
  .all(methodNotAllowed);
router
  .route('/profile')
  .get(validateRequest(GetProfileSchema), authController.getProfile)
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
    validateRequest(CreateUserSchema),
    authController.createUser
  )
  .all(methodNotAllowed);
router
  .route('/users/:id')
  .put(
    requireAdmin,
    validateRequest(UpdateUserSchema),
    authController.updateUser
  )
  .delete(
    requireAdmin,
    validateRequest(DeleteUserSchema),
    authController.deleteUser
  )
  .all(methodNotAllowed);
router
  .route('/users/:id/change-password')
  .put(
    validateRequest(ChangePasswordSchema),
    authController.changePassword
  )
  .all(methodNotAllowed);
router
  .route('/wipe-database')
  .post(
    validateRequest(WipeDatabaseSchema),
    authController.wipeDatabase
  )
  .all(methodNotAllowed);
router
  .route('/verify-admin')
  .post(validateRequest(VerifyAdminSchema), authController.verifyAdmin)
  .all(methodNotAllowed);
router
  .route('/complete-onboarding')
  .post(
    validateRequest(CompleteOnboardingSchema),
    authController.completeOnboarding
  )
  .all(methodNotAllowed);

export = router;
