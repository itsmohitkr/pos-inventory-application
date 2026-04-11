const express = require('express');
const authController = require('./auth.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/login').post(asyncHandler(authController.login)).all(methodNotAllowed);
router.route('/profile').get(asyncHandler(authController.getProfile)).all(methodNotAllowed);
router.route('/users').get(asyncHandler(authController.getAllUsers)).post(asyncHandler(authController.createUser)).all(methodNotAllowed);
router.route('/users/:id').put(asyncHandler(authController.updateUser)).delete(asyncHandler(authController.deleteUser)).all(methodNotAllowed);
router.route('/users/:id/change-password').put(asyncHandler(authController.changePassword)).all(methodNotAllowed);
router.route('/wipe-database').post(asyncHandler(authController.wipeDatabase)).all(methodNotAllowed);
router.route('/verify-admin').post(asyncHandler(authController.verifyAdmin)).all(methodNotAllowed);

module.exports = router;
