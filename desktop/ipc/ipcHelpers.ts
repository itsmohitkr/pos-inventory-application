// Shared building blocks for every desktop/ipc/*.ipc.ts handler file — pulled
// out once here rather than re-require()'d in each domain file, so there's a
// single place resolving these four server modules via resolveServerModulePath
// (never a hand-written relative require — see that file's comment for why).
import { resolveServerModulePath } from './resolveServerModule';

type ResponseHelpersModule = typeof import('../../server/dist/src/shared/utils/helper/responseHelpers');
type ResolveAppErrorModule = typeof import('../../server/dist/src/shared/error/resolveAppError');
type ValidateIpcPayloadModule = typeof import('../../server/dist/src/shared/ipc/validateIpcPayload');

const { buildSuccessPayload, buildErrorPayload }: ResponseHelpersModule = require(
  resolveServerModulePath('src', 'shared', 'utils', 'helper', 'responseHelpers')
);
const { resolveAppError }: ResolveAppErrorModule = require(
  resolveServerModulePath('src', 'shared', 'error', 'resolveAppError')
);
const { validateIpcPayload }: ValidateIpcPayloadModule = require(
  resolveServerModulePath('src', 'shared', 'ipc', 'validateIpcPayload')
);

export { buildSuccessPayload, buildErrorPayload, resolveAppError, validateIpcPayload };

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
