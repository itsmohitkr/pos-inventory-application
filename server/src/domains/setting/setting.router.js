const express = require('express');
const settingController = require('./setting.controller');
const asyncHandler = require('../../shared/error/asyncHandler');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const { updateSettingsBodySchema } = require('./setting.validation');

const router = express.Router();

router.route('/').get(asyncHandler(settingController.getAllSettings)).post(validateRequest({ body: updateSettingsBodySchema }), asyncHandler(settingController.updateSettings)).all(methodNotAllowed);

module.exports = router;
