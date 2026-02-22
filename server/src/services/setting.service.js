const prisma = require('../config/prisma');

const getAllSettings = async () => {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc, setting) => {
        try {
            acc[setting.key] = JSON.parse(setting.value);
        } catch (e) {
            acc[setting.key] = setting.value;
        }
        return acc;
    }, {});
};

const getSettingByKey = async (key) => {
    const setting = await prisma.setting.findUnique({
        where: { key }
    });
    if (!setting) return null;
    try {
        return JSON.parse(setting.value);
    } catch (e) {
        return setting.value;
    }
};

const updateSetting = async (key, value) => {
    const stringValue = JSON.stringify(value);
    return prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue }
    });
};

const updateMultipleSettings = async (settingsMap) => {
    const updates = Object.entries(settingsMap).map(([key, value]) =>
        updateSetting(key, value)
    );
    return Promise.all(updates);
};

module.exports = {
    getAllSettings,
    getSettingByKey,
    updateSetting,
    updateMultipleSettings
};
