import prisma = require('../../config/prisma');

/**
 * Settings are stored as TEXT and JSON-parsed on read, falling back to the raw
 * string when parsing fails. Values are therefore genuinely heterogeneous.
 */
export type SettingsMap = Record<string, unknown>;

const getAllSettings = async (): Promise<SettingsMap> => {
  const settings = await prisma.setting.findMany();
  return settings.reduce<SettingsMap>((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value);
    } catch (e) {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {});
};

/**
 * Callers state the shape they expect rather than receiving `any`, e.g.
 * getSettingByKey<ReceiptSettings>('posReceiptSettings').
 */
const getSettingByKey = async <T = unknown>(key: string): Promise<T | null> => {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });
  if (!setting) return null;
  try {
    return JSON.parse(setting.value) as T;
  } catch (e) {
    return setting.value as T;
  }
};

const updateSetting = async (key: string, value: unknown) => {
  const stringValue = JSON.stringify(value);
  return prisma.setting.upsert({
    where: { key },
    update: { value: stringValue },
    create: { key, value: stringValue },
  });
};

const updateMultipleSettings = async (settingsMap: SettingsMap) => {
  const updates = Object.entries(settingsMap).map(([key, value]) => updateSetting(key, value));
  return Promise.all(updates);
};

export {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
};
