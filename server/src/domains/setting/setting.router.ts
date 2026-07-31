import express = require('express');
import settingController = require('./setting.controller');
import methodNotAllowed = require('../../shared/error/methodNotAllowed');
import { validateRequest } from '../../shared/middleware/validateRequest';
import { UpdateSettingsSchema } from './setting.validation';

const router = express.Router();

router
  .route('/')
  .get(settingController.getAllSettings)
  .post(
    validateRequest(UpdateSettingsSchema),
    settingController.updateSettings
  )
  .all(methodNotAllowed);

export = router;
