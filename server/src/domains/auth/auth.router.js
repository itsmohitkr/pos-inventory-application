const express = require('express');
const authController = require('./auth.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
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
    wipeDatabaseBodySchema
} = require('./auth.validation');

const router = express.Router();

router.route('/login').post(validateRequest({ body: loginBodySchema }), asyncHandler(authController.login)).all(methodNotAllowed);
router.route('/profile').get(validateRequest({ query: profileQuerySchema }), asyncHandler(authController.getProfile)).all(methodNotAllowed);
router.route('/users').get(asyncHandler(authController.getAllUsers)).post(validateRequest({ body: createUserBodySchema }), asyncHandler(authController.createUser)).all(methodNotAllowed);
router.route('/users/:id').put(validateRequest({ params: userIdParamSchema, body: updateUserBodySchema }), asyncHandler(authController.updateUser)).delete(validateRequest({ params: userIdParamSchema }), asyncHandler(authController.deleteUser)).all(methodNotAllowed);
router.route('/users/:id/change-password').put(validateRequest({ params: userIdParamSchema, body: changePasswordBodySchema }), asyncHandler(authController.changePassword)).all(methodNotAllowed);
router.route('/wipe-database').post(validateRequest({ body: wipeDatabaseBodySchema }), asyncHandler(authController.wipeDatabase)).all(methodNotAllowed);
router.route('/verify-admin').post(validateRequest({ body: verifyAdminBodySchema }), asyncHandler(authController.verifyAdmin)).all(methodNotAllowed);

module.exports = router;
