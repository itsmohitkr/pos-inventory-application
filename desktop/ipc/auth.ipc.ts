// IPC handlers for the auth domain — replaces auth.router.ts /
// auth.controller.ts for packaged builds / electron-dev. See category.ipc.ts
// and the IPC migration plan for the shared pattern.
//
// Two deliberate deviations from the plain worked example, both flagged in
// the migration plan:
//  - `requireAdmin` has no Express middleware chain to run through here, so
//    createUser/updateUser/deleteUser re-check the same in-memory token store
//    (adminTokens.ts) directly, throwing the identical 401/403 AppError the
//    HTTP middleware throws. The renderer sends its stored admin token as an
//    `adminToken` payload field instead of the `X-Admin-Token` header.
//  - `authLimiter`/`passwordLimiter` (express-rate-limit) have no IPC
//    analogue — there is no network layer here to throttle, so rate limiting
//    is intentionally not replicated for the IPC path.
// `getProfile` has no client caller (confirmed dead — nothing in
// client/src calls GET /api/auth/profile), so it is not wired here, matching
// the precedent set for other confirmed-dead functions in this migration.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type AuthServiceModule = typeof import('../../server/dist/src/domains/auth/auth.service');
type AuthValidationModule = typeof import('../../server/dist/src/domains/auth/auth.validation');
type AdminTokensModule = typeof import('../../server/dist/src/domains/auth/adminTokens');
type AppErrorModule = typeof import('../../server/dist/src/shared/error/appError');

const authService: AuthServiceModule = require(
  resolveServerModulePath('src', 'domains', 'auth', 'auth.service')
);
const {
  LoginSchema,
  CreateUserSchema,
  UpdateUserSchema,
  DeleteUserSchema,
  ChangePasswordSchema,
  WipeDatabaseSchema,
  VerifyAdminSchema,
  CompleteOnboardingSchema,
}: AuthValidationModule = require(resolveServerModulePath('src', 'domains', 'auth', 'auth.validation'));
const { resolveToken }: AdminTokensModule = require(
  resolveServerModulePath('src', 'domains', 'auth', 'adminTokens')
);
const { createHttpError }: AppErrorModule = require(
  resolveServerModulePath('src', 'shared', 'error', 'appError')
);

/** Mirrors requireAdmin.ts exactly, reading the token from the payload instead of the X-Admin-Token header. */
const assertAdmin = (adminToken: unknown): void => {
  const entry = resolveToken(typeof adminToken === 'string' ? adminToken : undefined);

  if (!entry) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Admin verification required', {
      error: 'Admin verification required',
    });
  }

  if (entry.role !== 'admin') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Admin privileges required', {
      error: 'Admin privileges required',
    });
  }
};

export const registerAuthIpc = (): void => {
  ipcMain.handle(IPC.AUTH_LOGIN, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(LoginSchema, { body: payload });
      const user = await authService.login(body as Parameters<typeof authService.login>[0]);
      return buildSuccessPayload(StatusCodes.OK, user, 'Login successful', { format: 'merge' });
    })
  );

  ipcMain.handle(IPC.AUTH_GET_ALL_USERS, async () =>
    withErrorHandling(async () => {
      const users = await authService.getAllUsers();
      return buildSuccessPayload(StatusCodes.OK, users, 'Users fetched successfully', { format: 'raw' });
    })
  );

  ipcMain.handle(IPC.AUTH_CREATE_USER, async (_event, payload: { adminToken?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { adminToken, ...rest } = (payload ?? {}) as { adminToken?: unknown; [key: string]: unknown };
      assertAdmin(adminToken);
      const { body } = validateIpcPayload(CreateUserSchema, { body: rest });
      const user = await authService.createUser(body as Parameters<typeof authService.createUser>[0]);
      return buildSuccessPayload(StatusCodes.CREATED, user, 'User created successfully', { format: 'merge' });
    })
  );

  ipcMain.handle(
    IPC.AUTH_UPDATE_USER,
    async (_event, payload: { id?: unknown; adminToken?: unknown; [key: string]: unknown }) =>
      withErrorHandling(async () => {
        const { id, adminToken, ...body } = (payload ?? {}) as {
          id?: unknown;
          adminToken?: unknown;
          [key: string]: unknown;
        };
        assertAdmin(adminToken);
        const validated = validateIpcPayload(UpdateUserSchema, { params: { id }, body });
        const user = await authService.updateUser(
          (validated.params as { id: number }).id,
          validated.body as Parameters<typeof authService.updateUser>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, user, 'User updated successfully', { format: 'merge' });
      })
  );

  ipcMain.handle(IPC.AUTH_DELETE_USER, async (_event, payload: { id?: unknown; adminToken?: unknown }) =>
    withErrorHandling(async () => {
      assertAdmin(payload?.adminToken);
      const { params } = validateIpcPayload(DeleteUserSchema, { params: { id: payload?.id } });
      await authService.deleteUser((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, undefined, 'User deleted successfully');
    })
  );

  ipcMain.handle(IPC.AUTH_CHANGE_PASSWORD, async (_event, payload: { id?: unknown; [key: string]: unknown }) =>
    withErrorHandling(async () => {
      const { id, ...body } = (payload ?? {}) as { id?: unknown; [key: string]: unknown };
      const validated = validateIpcPayload(ChangePasswordSchema, { params: { id }, body });
      await authService.changePassword(
        (validated.params as { id: number }).id,
        validated.body as Parameters<typeof authService.changePassword>[1]
      );
      return buildSuccessPayload(StatusCodes.OK, undefined, 'Password changed successfully');
    })
  );

  ipcMain.handle(IPC.AUTH_WIPE_DATABASE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(WipeDatabaseSchema, { body: payload });
      const result = await authService.wipeDatabase(body as Parameters<typeof authService.wipeDatabase>[0]);
      return buildSuccessPayload(
        StatusCodes.OK,
        result,
        'Database wiped successfully. All data deleted except your admin account.',
        { format: 'merge' }
      );
    })
  );

  ipcMain.handle(IPC.AUTH_VERIFY_ADMIN, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(VerifyAdminSchema, { body: payload });
      const { token, expiresAt } = await authService.verifyAdmin(
        body as Parameters<typeof authService.verifyAdmin>[0]
      );
      return buildSuccessPayload(
        StatusCodes.OK,
        { adminToken: token, adminTokenExpiresAt: expiresAt },
        'Admin verified',
        { format: 'merge' }
      );
    })
  );

  ipcMain.handle(IPC.AUTH_COMPLETE_ONBOARDING, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CompleteOnboardingSchema, { body: payload });
      await authService.completeOnboarding(body as Parameters<typeof authService.completeOnboarding>[0]);
      return buildSuccessPayload(StatusCodes.OK, { success: true }, 'Onboarding completed', {
        format: 'merge',
      });
    })
  );
};
