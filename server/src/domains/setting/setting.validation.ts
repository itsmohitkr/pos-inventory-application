import { z, str } from '../../shared/middleware/zodHelpers';

const keyValueSettingsSchema = z.object({
  key: str().min(1, 'Setting key is required'),
  value: z.any(),
});

const bulkSettingsSchema = z.object({
  // Joi.object().pattern(string, any).min(1) — at least one entry.
  settings: z.record(z.string(), z.any()).refine((v) => Object.keys(v).length >= 1, {
    message: 'settings must contain at least 1 key',
  }),
});

const updateSettingsBodySchema = z.union([bulkSettingsSchema, keyValueSettingsSchema]);

/** One grouped schema per router route, named after the controller handler it validates for. */
export const UpdateSettingsSchema = { body: updateSettingsBodySchema };

/**
 * Service input type derived from the schema above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema.body>;
