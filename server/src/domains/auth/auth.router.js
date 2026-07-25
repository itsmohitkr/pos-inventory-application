const express = require('express');
const authController = require('./auth.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const {
  userIdParamSchema,
  profileQuerySchema,
  loginBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
  changePasswordBodySchema,
  verifyAdminBodySchema,
  wipeDatabaseBodySchema,
  completeOnboardingBodySchema,
} = require('./auth.validation');

const router = express.Router();

router
  .route('/login')
  .post(validateRequest({ body: loginBodySchema }), authController.login)
  .all(methodNotAllowed);
router
  .route('/profile')
  .get(validateRequest({ query: profileQuerySchema }), authController.getProfile)
  .all(methodNotAllowed);
router
  .route('/users')
  .get(authController.getAllUsers)
  .post(validateRequest({ body: createUserBodySchema }), authController.createUser)
  .all(methodNotAllowed);
router
  .route('/users/:id')
  .put(
    validateRequest({ params: userIdParamSchema, body: updateUserBodySchema }),
    authController.updateUser
  )
  .delete(validateRequest({ params: userIdParamSchema }), authController.deleteUser)
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

module.exports = router;
