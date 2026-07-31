import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import settingService = require('./setting.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const getAllSettings = async (_req: Request, res: Response) => {
  const settings = await settingService.getAllSettings();
  return sendSuccessResponse(res, StatusCodes.OK, settings, 'Settings fetched successfully');
};

const updateSettings = async (req: Request, res: Response) => {
  const message = await settingService.updateSettingsRequest(req.body);
  return sendSuccessResponse(res, StatusCodes.OK, undefined, message);
};

export = {
  getAllSettings: asyncHandler(getAllSettings),
  updateSettings: asyncHandler(updateSettings),
};
