const express = require('express');
const settingController = require('./controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');

const router = express.Router();

router.route('/').get(asyncHandler(settingController.getAllSettings)).post(asyncHandler(settingController.updateSettings)).all(methodNotAllowed);

module.exports = router;
