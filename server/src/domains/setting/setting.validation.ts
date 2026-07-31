import { z, str } from '../../shared/middleware/zodHelpers';

/** One grouped schema per router route, named after the controller handler it validates for. */
export const UpdateSettingsSchema = {
  body: z.union([
    z.object({
      // Joi.object().pattern(string, any).min(1) — at least one entry.
      settings: z.record(z.string(), z.any()).refine((v) => Object.keys(v).length >= 1, {
        message: 'settings must contain at least 1 key',
      }),
    }),
    z.object({
      key: str().min(1, 'Setting key is required'),
      value: z.any(),
    }),
  ]),
};

/**
 * Service input type derived from the schema above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema.body>;
