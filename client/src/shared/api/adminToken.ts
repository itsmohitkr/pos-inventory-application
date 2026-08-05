/**
 * The admin elevation token, as held by the renderer.
 *
 * The server mints this when an admin proves their password (login, or the
 * "Verify Admin" prompt) and requires it on the routes that grant durable
 * privilege — creating, modifying and deleting users. See
 * server/src/domains/auth/adminTokens.ts.
 *
 * It lives in localStorage beside the elevation expiry the app already tracks,
 * so an elevated session survives a window reload the same way it always has.
 * Note that this raises the bar rather than making the terminal a hard
 * boundary: someone with devtools open while an admin is elevated can read the
 * token during its window. It stops the far easier attack — editing
 * `posCurrentUser.role` or POSTing directly to the API.
 */

const STORAGE_KEY = 'posAdminToken';
const EXPIRY_KEY = 'posAdminTokenExpiry';

/** Returns the token only while it is still within its window. */
export const getAdminToken = (): string | null => {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return null;

    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY));
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      clearAdminToken();
      return null;
    }

    return token;
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string, expiresAt: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  } catch {
    // Storage unavailable (private mode, quota). The user is asked to verify
    // again on the next privileged action rather than the app breaking.
  }
};

export const clearAdminToken = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch {
    // Nothing to do — see above.
  }
};
