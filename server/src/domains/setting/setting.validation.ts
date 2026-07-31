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

/**
 * Service input type derived from the schema above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type UpdateSettingsInput = z.infer<typeof updateSettingsBodySchema>;

export { updateSettingsBodySchema };
