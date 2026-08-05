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

/** Shared by every route keyed on a user id — UpdateUser, DeleteUser, ChangePassword. */
const userIdParamSchema = idParamSchema();

/** One grouped schema per router route, named after the controller handler it validates for. */
export const LoginSchema = {
  body: z.object({
    username: str().min(1, 'Username is required').max(100, 'Username is too long'),
    password: z.string().min(1, 'Password is required').max(255, 'Password is too long'),
  }),
};

export const GetProfileSchema = {
  query: z.object({ userId: id() }),
};

export const CreateUserSchema = {
  body: z.object({
    username: str().min(1, 'Username is required').max(100, 'Username is too long'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(255, 'Password is too long'),
    role: z.enum(ROLES, { error: 'Role must be admin, cashier, or salesman' }).optional(),
  }),
};

export const UpdateUserSchema = {
  params: userIdParamSchema,
  // Joi's .min(1) on an all-optional object — at least one field must be present.
  body: z
    .object({
      role: z.enum(ROLES, { error: 'Role must be admin, cashier, or salesman' }).optional(),
      status: z.enum(STATUSES, { error: 'Status must be active or inactive' }).optional(),
      password: z.string().min(1, 'Password is required').max(255, 'Password is too long').optional(),
    })
    .refine(atLeastOneField, {
      message: AT_LEAST_ONE_FIELD_MESSAGE,
    }),
};

export const DeleteUserSchema = { params: userIdParamSchema };

export const ChangePasswordSchema = {
  params: userIdParamSchema,
  body: z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(255, 'New password is too long'),
  }),
};

export const WipeDatabaseSchema = {
  body: z.object({
    username: str().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required').max(255, 'Password is too long'),
    // The exact phrase is enforced server-side so the UI check cannot be bypassed.
    confirmPhrase: z.literal('WIPE ALL DATA', {
      message: 'Confirmation phrase must be exactly WIPE ALL DATA',
    }),
  }),
};

export const VerifyAdminSchema = {
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
};

export const CompleteOnboardingSchema = {
  body: z.object({
    shopName: z.string().min(1, 'Shop name is required').max(100, 'Shop name is too long'),
    address: z.string().max(255, 'Address is too long').optional(),
    phone: z.string().max(20, 'Phone number is too long').optional(),
    phone2: z.string().max(20, 'Phone number is too long').optional(),
    // Joi.string().email().allow('') — an empty string must still pass.
    email: z.union([z.email('Invalid email address'), z.literal('')]).optional(),
    gst: z.string().max(20, 'GST number is too long').optional(),
    logo: z.string().optional(),
    adminPassword: z.string().min(8, 'Admin password must be at least 8 characters').max(255, 'Admin password is too long'),
  }),
};

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
