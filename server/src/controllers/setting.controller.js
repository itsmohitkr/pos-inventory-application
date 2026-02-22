const settingService = require('../services/setting.service');

const getAllSettings = async (req, res) => {
    try {
        const settings = await settingService.getAllSettings();
        res.json({ data: settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { key, value, settings } = req.body;

        if (settings && typeof settings === 'object') {
            await settingService.updateMultipleSettings(settings);
            return res.json({ message: 'Settings updated successfully' });
        }

        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }

        await settingService.updateSetting(key, value);
        res.json({ message: `Setting ${key} updated successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllSettings,
    updateSettings
};
