import express = require('express');
import settingController = require('./setting.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import { updateSettingsBodySchema } from './setting.validation';

const router = express.Router();

router
  .route('/')
  .get(settingController.getAllSettings)
  .post(
    validateRequest({ body: updateSettingsBodySchema }),
    settingController.updateSettings
  )
  .all(methodNotAllowed);

export = router;
