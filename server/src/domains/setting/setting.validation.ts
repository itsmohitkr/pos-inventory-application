import { z, str } from '../../shared/middleware/zodHelpers';

const keyValueSettingsSchema = z.object({
  key: str().min(1),
  value: z.any(),
});

const bulkSettingsSchema = z.object({
  // Joi.object().pattern(string, any).min(1) — at least one entry.
  settings: z.record(z.string(), z.any()).refine((v) => Object.keys(v).length >= 1, {
    message: 'settings must contain at least 1 key',
  }),
});

const updateSettingsBodySchema = z.union([bulkSettingsSchema, keyValueSettingsSchema]);

export { updateSettingsBodySchema };
