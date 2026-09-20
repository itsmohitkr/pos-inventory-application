import { PUBLIC_KEYS, type EnforcementMode } from '@trovix/license-contract';

/**
 * Baked in when licensing ships. Empty means licensing is OFF in this build: no network calls, no gate, no
 * banner, so merging this code changes nothing for existing customers until a real URL and key are set.
 */
const BUILT_IN_API_URL = '';

/**
 * Epoch milliseconds of the first license-enabled release. An install whose database is older than this claims
 * "legacy" status (grandfathering). 0 disables legacy claims entirely.
 */
export const LICENSE_RELEASE_TIME_MS = 0;

export interface LicenseRuntimeConfig {
  apiUrl: string;
  publicKeys: Record<string, string>;
  defaultEnforcement: EnforcementMode;
  refreshIntervalMs: number;
}

const DEFAULT_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

const isLocalHttp = (url: URL): boolean =>
  url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');

/**
 * Returns null when licensing is not configured. Environment overrides exist for local development only and
 * are ignored in packaged builds: a user must not be able to point the app at their own server or key. (A
 * fake server could not forge a token without the private key anyway, but there is no reason to allow it.)
 */
export const resolveLicenseConfig = (
  env: NodeJS.ProcessEnv,
  isPackaged: boolean
): LicenseRuntimeConfig | null => {
  let apiUrl = BUILT_IN_API_URL;
  const publicKeys: Record<string, string> = { ...PUBLIC_KEYS };
  let refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS;

  if (!isPackaged) {
    if (env.TROVIX_LICENSE_API_URL) apiUrl = env.TROVIX_LICENSE_API_URL;
    const devKey = env.TROVIX_LICENSE_DEV_PUBLIC_KEY;
    if (devKey) {
      const separator = devKey.indexOf(':');
      if (separator > 0) publicKeys[devKey.slice(0, separator)] = devKey.slice(separator + 1);
    }
    // Lets a developer watch state changes live instead of waiting hours for the next refresh.
    const seconds = Number(env.TROVIX_LICENSE_REFRESH_SECONDS);
    if (Number.isInteger(seconds) && seconds >= 2 && seconds <= 86_400)
      refreshIntervalMs = seconds * 1000;
  }

  if (!apiUrl || Object.keys(publicKeys).length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && !(isLocalHttp(parsed) && !isPackaged)) return null;

  return {
    apiUrl: parsed.toString().replace(/\/$/, ''),
    publicKeys,
    defaultEnforcement: 'warn',
    refreshIntervalMs,
  };
};
