import prisma = require('../../config/prisma');
import type { UpdateSettingsInput } from './setting.validation';

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
    } catch {
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
  } catch {
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

/**
 * Handles the two shapes `updateSettingsBodySchema` accepts: a bulk
 * `{ settings: {...} }` map, or a single `{ key, value }` pair. Returns the
 * message the controller responds with, so the two call paths stay
 * distinguishable to the client without the controller inspecting the body.
 */
const updateSettingsRequest = async (input: UpdateSettingsInput): Promise<string> => {
  if ('settings' in input && input.settings && Object.keys(input.settings).length > 0) {
    await updateMultipleSettings(input.settings);
    return 'Settings updated successfully';
  }

  const { key, value } = input as { key: string; value: unknown };
  await updateSetting(key, value);
  return `Setting ${key} updated successfully`;
};

export {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  updateSettingsRequest,
};
