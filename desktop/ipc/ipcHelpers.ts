// Shared building blocks for every desktop/ipc/*.ipc.ts handler file — pulled
// out once here rather than re-require()'d in each domain file, so there's a
// single place resolving these four server modules via resolveServerModulePath
// (never a hand-written relative require — see that file's comment for why).
import { StatusCodes } from 'http-status-codes';
import { resolveServerModulePath } from './resolveServerModule';

type ResponseHelpersModule = typeof import('../../server/dist/src/shared/utils/helper/responseHelpers');
type ResolveAppErrorModule = typeof import('../../server/dist/src/shared/error/resolveAppError');
type ValidateIpcPayloadModule = typeof import('../../server/dist/src/shared/ipc/validateIpcPayload');
type AdminTokensModule = typeof import('../../server/dist/src/domains/auth/adminTokens');
type AppErrorModule = typeof import('../../server/dist/src/shared/error/appError');

const { buildSuccessPayload, buildErrorPayload }: ResponseHelpersModule = require(
  resolveServerModulePath('src', 'shared', 'utils', 'helper', 'responseHelpers')
);
const { resolveAppError }: ResolveAppErrorModule = require(
  resolveServerModulePath('src', 'shared', 'error', 'resolveAppError')
);
const { validateIpcPayload }: ValidateIpcPayloadModule = require(
  resolveServerModulePath('src', 'shared', 'ipc', 'validateIpcPayload')
);
const { resolveToken }: AdminTokensModule = require(
  resolveServerModulePath('src', 'domains', 'auth', 'adminTokens')
);
const { createHttpError }: AppErrorModule = require(
  resolveServerModulePath('src', 'shared', 'error', 'appError')
);

export { buildSuccessPayload, buildErrorPayload, resolveAppError, validateIpcPayload };

/**
 * Mirrors requireAdmin.ts's Express middleware exactly, reading the token
 * from an IPC payload field instead of the X-Admin-Token header. Shared by
 * every domain IPC file gating a durable-privilege action (auth's user
 * management, category-sale's product-discount overrides) on a live admin
 * elevation token, same as the HTTP path.
 */
export const assertAdmin = (adminToken: unknown): void => {
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

export type IpcResponsePayload = { status: number; body?: unknown; noBody?: boolean };

/**
 * Runs an IPC handler body, translating a thrown error into the same
 * {status, body} shape a migrated route's HTTP error would have had.
 * Every ipcMain.handle callback in every domain file wraps its body in this.
 */
export const withErrorHandling = async (
  fn: () => Promise<IpcResponsePayload>
): Promise<IpcResponsePayload> => {
  try {
    return await fn();
  } catch (err) {
    const { statusCode, message, errorLabel, details } = resolveAppError(err as never);
    return buildErrorPayload(statusCode, message, errorLabel, { details });
  }
};
