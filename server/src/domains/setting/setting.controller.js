const { StatusCodes } = require('http-status-codes');
const settingService = require('./setting.service');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

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

module.exports = {
    getAllSettings,
    updateSettings
};
