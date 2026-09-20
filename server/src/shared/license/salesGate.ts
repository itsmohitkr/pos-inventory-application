import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createHttpError } from '../error/appError';

/**
 * Single choke point deciding whether NEW sales may be recorded.
 *
 * The Electron main process owns the license state and registers the decision function at boot
 * (desktop/license). Both entry points that create a sale — the domain IPC handlers and the Express
 * routes — consult the same module instance in-process, the same way adminTokens is shared. Returns and
 * refunds are deliberately not gated: a lapsed license must never stop a shop refunding a customer.
 *
 * Fail-open by design: with no gate registered (standalone server, tests, licensing not configured) sales
 * are allowed, and a bug inside the gate function is swallowed rather than blocking checkout.
 */

export type SalesBlockReason = 'LICENSE_EXPIRED' | 'LICENSE_REVOKED' | 'LICENSE_UNVERIFIED';

export type SalesGateDecision =
  | { allowed: true }
  | { allowed: false; reason: SalesBlockReason; message: string };

export type SalesGate = () => SalesGateDecision;

const ALLOW: SalesGateDecision = { allowed: true };

let currentGate: SalesGate = () => ALLOW;

export const setSalesGate = (gate: SalesGate | null): void => {
  currentGate = gate ?? (() => ALLOW);
};

export const evaluateSalesGate = (): SalesGateDecision => {
  try {
    return currentGate();
  } catch {
    return ALLOW;
  }
};

export const assertSalesAllowed = (): void => {
  const decision = evaluateSalesGate();
  if (decision.allowed) return;

  // 402 for an ended entitlement, 403 for an explicit revocation.
  const status =
    decision.reason === 'LICENSE_REVOKED' ? StatusCodes.FORBIDDEN : StatusCodes.PAYMENT_REQUIRED;
  throw createHttpError(status, decision.message, { error: decision.reason });
};

export const requireSalesAllowed = (_req: Request, _res: Response, next: NextFunction): void => {
  try {
    assertSalesAllowed();
    next();
  } catch (error) {
    next(error);
  }
};
