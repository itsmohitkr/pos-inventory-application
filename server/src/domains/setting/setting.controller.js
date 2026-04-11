const settingService = require('./setting.service');
const { createHttpError } = require('../../shared/error/appError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const getAllSettings = async (_req, res) => {
    const settings = await settingService.getAllSettings();
    return sendSuccessResponse(res, 200, settings, 'Settings fetched successfully');
};

const updateSettings = async (req, res) => {
    const { key, value, settings } = req.body;

    if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
        await settingService.updateMultipleSettings(settings);
        return sendSuccessResponse(res, 200, undefined, 'Settings updated successfully');
    }

    if (!key) {
        throw createHttpError(400, 'Key is required', {
            error: 'Key is required'
        });
    }

    await settingService.updateSetting(key, value);
    return sendSuccessResponse(res, 200, undefined, `Setting ${key} updated successfully`);
};

module.exports = {
    getAllSettings,
    updateSettings
};
