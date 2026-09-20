import type { NextFunction, Request, Response } from 'express';
import {
  assertSalesAllowed,
  evaluateSalesGate,
  requireSalesAllowed,
  setSalesGate,
} from '../../src/shared/license/salesGate';

describe('salesGate', () => {
  afterEach(() => setSalesGate(null));

  it('allows sales when no gate is registered', () => {
    expect(evaluateSalesGate()).toEqual({ allowed: true });
    expect(() => assertSalesAllowed()).not.toThrow();
  });

  it('blocks an ended entitlement with 402 and a machine-readable reason', () => {
    setSalesGate(() => ({
      allowed: false,
      reason: 'LICENSE_EXPIRED',
      message: 'Your license has expired.',
    }));
    expect(() => assertSalesAllowed()).toThrow(
      expect.objectContaining({
        statusCode: 402,
        message: 'Your license has expired.',
        error: 'LICENSE_EXPIRED',
      })
    );
  });

  it('blocks a revoked license with 403', () => {
    setSalesGate(() => ({ allowed: false, reason: 'LICENSE_REVOKED', message: 'Access revoked.' }));
    expect(() => assertSalesAllowed()).toThrow(
      expect.objectContaining({ statusCode: 403, error: 'LICENSE_REVOKED' })
    );
  });

  it('fails open if the gate function itself throws', () => {
    setSalesGate(() => {
      throw new Error('bug in gate');
    });
    expect(evaluateSalesGate()).toEqual({ allowed: true });
    expect(() => assertSalesAllowed()).not.toThrow();
  });

  it('can be cleared back to allow-all', () => {
    setSalesGate(() => ({ allowed: false, reason: 'LICENSE_EXPIRED', message: 'x' }));
    setSalesGate(null);
    expect(evaluateSalesGate()).toEqual({ allowed: true });
  });

  describe('requireSalesAllowed middleware', () => {
    const run = (): jest.Mock => {
      const next = jest.fn();
      requireSalesAllowed({} as Request, {} as Response, next as unknown as NextFunction);
      return next;
    };

    it('calls next() with no error when allowed', () => {
      const next = run();
      expect(next).toHaveBeenCalledWith();
    });

    it('passes the blocking error to next() when blocked', () => {
      setSalesGate(() => ({
        allowed: false,
        reason: 'LICENSE_UNVERIFIED',
        message: 'Cannot verify license.',
      }));
      const next = run();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 402, error: 'LICENSE_UNVERIFIED' })
      );
    });
  });
});
