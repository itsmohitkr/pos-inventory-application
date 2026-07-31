import {
  z,
  id,
  str,
  idParamSchema,
  atLeastOneField,
  AT_LEAST_ONE_FIELD_MESSAGE,
} from '../../shared/middleware/zodHelpers';

const ROLES = ['admin', 'cashier', 'salesman'] as const;
const STATUSES = ['active', 'inactive'] as const;

const userIdParamSchema = idParamSchema();

const profileQuerySchema = z.object({ userId: id() });

const loginBodySchema = z.object({
  username: str().min(1).max(100),
  password: z.string().min(1).max(255),
});

const createUserBodySchema = z.object({
  username: str().min(1).max(100),
  password: z.string().min(8).max(255),
  role: z.enum(ROLES).optional(),
});

// Joi's .min(1) on an all-optional object — at least one field must be present.
const updateUserBodySchema = z
  .object({
    role: z.enum(ROLES).optional(),
    status: z.enum(STATUSES).optional(),
    password: z.string().min(1).max(255).optional(),
  })
  .refine(atLeastOneField, {
    message: AT_LEAST_ONE_FIELD_MESSAGE,
  });

const changePasswordBodySchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(255),
});

const completeOnboardingBodySchema = z.object({
  shopName: z.string().min(1).max(100),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  phone2: z.string().max(20).optional(),
  // Joi.string().email().allow('') — an empty string must still pass.
  email: z.union([z.email(), z.literal('')]).optional(),
  gst: z.string().max(20).optional(),
  logo: z.string().optional(),
  adminPassword: z.string().min(8).max(255),
});

const verifyAdminBodySchema = z.object({
  password: z.string().min(1),
});

const wipeDatabaseBodySchema = z.object({
  username: str().min(1),
  password: z.string().min(1).max(255),
  // The exact phrase is enforced server-side so the UI check cannot be bypassed.
  confirmPhrase: z.literal('WIPE ALL DATA', {
    message: 'Confirmation phrase must be exactly WIPE ALL DATA',
  }),
});

/** One grouped schema per router route, named after the controller handler it validates for. */
export const LoginSchema = { body: loginBodySchema };
export const GetProfileSchema = { query: profileQuerySchema };
export const CreateUserSchema = { body: createUserBodySchema };
export const UpdateUserSchema = { params: userIdParamSchema, body: updateUserBodySchema };
export const DeleteUserSchema = { params: userIdParamSchema };
export const ChangePasswordSchema = { params: userIdParamSchema, body: changePasswordBodySchema };
export const WipeDatabaseSchema = { body: wipeDatabaseBodySchema };
export const VerifyAdminSchema = { body: verifyAdminBodySchema };
export const CompleteOnboardingSchema = { body: completeOnboardingBodySchema };

/**
 * Service input types derived from the schemas above, so the validated shape
 * and the type the service declares cannot drift apart.
 */
export type LoginInput = z.infer<typeof LoginSchema.body>;
export type CreateUserInput = z.infer<typeof CreateUserSchema.body>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema.body>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema.body>;
export type VerifyAdminInput = z.infer<typeof VerifyAdminSchema.body>;
export type WipeDatabaseInput = z.infer<typeof WipeDatabaseSchema.body>;
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema.body>;
