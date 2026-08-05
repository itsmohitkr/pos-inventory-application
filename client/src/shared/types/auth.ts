/**
 * The signed-in user, as the renderer holds it.
 *
 * This is the server's sanitised user (password stripped by auth.service's
 * SafeUser) plus one client-only field: `originalRole`, set while a cashier is
 * temporarily elevated to admin so the previous role can be restored when the
 * elevation times out.
 *
 * The user is persisted to localStorage under `posCurrentUser` and re-read on
 * boot, so anything added here must survive a JSON round trip.
 */
export interface AuthUser {
  id: number;
  username: string;
  role: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Present only during an active admin elevation. */
  originalRole?: string;
  /**
   * Elevation token, returned by the login response for admins only. It is
   * moved into its own storage key by handleLogin and is NOT part of the
   * persisted user — see shared/api/adminToken.ts.
   */
  adminToken?: string;
  /** Epoch milliseconds. */
  adminTokenExpiresAt?: number;
}

/** Result shape shared by the admin-elevation calls. */
export interface AuthActionResult {
  success: boolean;
  error?: string;
}
