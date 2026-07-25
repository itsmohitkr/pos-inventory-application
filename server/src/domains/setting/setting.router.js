const express = require('express');
const settingController = require('./setting.controller');
const methodNotAllowed = require('../../shared/error/methodNotAllowed');
const { validateRequest } = require('../../shared/middleware/validateRequest');
const { updateSettingsBodySchema } = require('./setting.validation');

const router = express.Router();

router
  .route('/')
  .get(settingController.getAllSettings)
  .post(
    validateRequest({ body: updateSettingsBodySchema }),
    settingController.updateSettings
  )
  .all(methodNotAllowed);

module.exports = router;
