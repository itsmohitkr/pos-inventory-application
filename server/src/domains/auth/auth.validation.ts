import { z, id, str } from '../../shared/middleware/zodHelpers';

const ROLES = ['admin', 'cashier', 'salesman'] as const;
const STATUSES = ['active', 'inactive'] as const;

const userIdParamSchema = z.object({ id: id() });

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
  .refine((v) => Object.keys(v).length >= 1, {
    message: 'at least one field is required',
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

export {
  userIdParamSchema,
  profileQuerySchema,
  loginBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
  changePasswordBodySchema,
  verifyAdminBodySchema,
  wipeDatabaseBodySchema,
  completeOnboardingBodySchema,
};
