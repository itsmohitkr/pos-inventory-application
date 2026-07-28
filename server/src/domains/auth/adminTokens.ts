import crypto = require('crypto');
import settingService = require('../setting/setting.service');

/**
 * Short-lived elevation tokens proving a request came from a verified admin.
 *
 * WHY THIS EXISTS
 * ---------------
 * The API has no session layer: the server binds to 127.0.0.1 and auth was
 * left "UI-enforced in the renderer" (see CLAUDE.md). That holds against a
 * network attacker but not against the person at the till — admin status was
 * only ever `currentUser.role === 'admin'` read from localStorage, so a
 * cashier could edit that value, or POST directly to
 * `PUT /api/auth/users/:id` and make the promotion permanent.
 *
 * A token is minted when an admin proves their password (login, or the
 * "Verify Admin" elevation prompt) and is required by the routes that grant
 * durable privilege.
 *
 * DELIBERATELY IN MEMORY
 * ----------------------
 * The server is a single process inside Electron, so a Map is sufficient and
 * correct — there is no second instance to share state with. Tokens are lost
 * on restart, which means the admin re-enters their password after an app
 * relaunch. That is acceptable, and arguably the safer default.
 */

export interface AdminToken {
  userId: number;
  username: string;
  role: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

/** Used when the setting is missing or unparseable. Mirrors the client default. */
const DEFAULT_TTL_MINUTES = 15;

const tokens = new Map<string, AdminToken>();

/**
 * Elevation lifetime, read from the same `posAdminAutoLogoutTime` setting the
 * renderer uses for its countdown, so the two cannot drift apart.
 */
const resolveTtlMs = async (): Promise<number> => {
  try {
    const stored = await settingService.getSettingByKey<number | string>(
      'posAdminAutoLogoutTime'
    );
    const minutes = Number(stored);
    if (Number.isFinite(minutes) && minutes > 0) {
      return minutes * 60 * 1000;
    }
  } catch {
    // Setting unreadable — fall through to the default rather than failing the
    // login this is called from.
  }
  return DEFAULT_TTL_MINUTES * 60 * 1000;
};

/** Drops expired entries so the Map cannot grow without bound. */
const sweep = (now: number): void => {
  for (const [token, entry] of tokens) {
    if (entry.expiresAt <= now) tokens.delete(token);
  }
};

export interface IssuedToken {
  token: string;
  expiresAt: number;
}

/** Issues a token for an already-authenticated admin. */
export const issueToken = async (user: {
  id: number;
  username: string;
  role: string;
}): Promise<IssuedToken> => {
  const now = Date.now();
  sweep(now);

  const token = crypto.randomUUID();
  const expiresAt = now + (await resolveTtlMs());

  tokens.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
  });

  return { token, expiresAt };
};

/** Returns the token's entry, or null when it is unknown or expired. */
export const resolveToken = (token: string | undefined): AdminToken | null => {
  if (!token) return null;

  const entry = tokens.get(token);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    tokens.delete(token);
    return null;
  }

  return entry;
};

/** Invalidates a single token — used on logout and on stepping down from admin. */
export const revokeToken = (token: string | undefined): void => {
  if (token) tokens.delete(token);
};

/** Test seam: clears every token. Not reachable from any route. */
export const __clearAllTokens = (): void => {
  tokens.clear();
};
