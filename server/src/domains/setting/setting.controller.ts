import { StatusCodes } from 'http-status-codes';
import settingService = require('./setting.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const getAllSettings = async (_req, res) => {
  const settings = await settingService.getAllSettings();
  return sendSuccessResponse(res, StatusCodes.OK, settings, 'Settings fetched successfully');
};

const updateSettings = async (req, res) => {
  const { key, value, settings } = req.body;

  if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
    await settingService.updateMultipleSettings(settings);
    return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Settings updated successfully');
  }

  await settingService.updateSetting(key, value);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, `Setting ${key} updated successfully`);
};

export = {
  getAllSettings: asyncHandler(getAllSettings),
  updateSettings: asyncHandler(updateSettings),
};
