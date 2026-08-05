import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import type { Response } from 'express';
import ResponseBody = require('./responseBody');

/** How the payload is shaped on the wire. */
export type ResponseFormat = 'wrapped' | 'merge' | 'raw';

export interface SuccessOptions {
  format?: ResponseFormat;
  meta?: Record<string, unknown>;
}

export interface ErrorOptions {
  details?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * Result of computing what a response body would be, decoupled from `res`.
 *
 * `body: undefined` specifically marks the 204-No-Content case (send with no
 * body) — distinct from a success response whose `data` happens to be
 * undefined, which still gets a JSON envelope.
 */
export interface ResponsePayload {
  status: number;
  body?: unknown;
  /** True only for the 204 case, where the caller must .send() not .json(). */
  noBody?: boolean;
}

/**
 * Pure computation of a success response body — every branch
 * `sendSuccessResponse` used to inline directly against `res`. Extracted so
 * IPC handlers (desktop/ipc/*.ipc.ts) can build the *exact* same payload
 * shape a migrated route's HTTP response would have had, without needing an
 * Express `res` object. See the IPC migration plan for why this exists.
 */
export const buildSuccessPayload = (
  status: number = StatusCodes.OK,
  data?: unknown,
  message: string = ReasonPhrases.OK,
  options: SuccessOptions = {}
): ResponsePayload => {
  const { format = 'wrapped', meta = {} } = options;

  if (status === StatusCodes.NO_CONTENT) {
    return { status, noBody: true };
  }

  if (format === 'raw') {
    return { status, body: data };
  }

  if (format === 'merge') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { status, body: { success: true, message, ...data, ...meta } };
    }

    if (data === undefined) {
      return { status, body: { success: true, message, ...meta } };
    }

    return { status, body: { success: true, message, data, ...meta } };
  }

  return { status, body: ResponseBody.successResponse(message, data, meta) };
};

/**
 * Pure computation of an error response body — same rationale as
 * buildSuccessPayload above.
 */
export const buildErrorPayload = (
  status: number = StatusCodes.INTERNAL_SERVER_ERROR,
  message: string = ReasonPhrases.INTERNAL_SERVER_ERROR,
  error?: unknown,
  options: ErrorOptions = {}
): ResponsePayload => {
  const { details, meta = {} } = options;
  const normalizedError =
    error ??
    (status >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : message);

  return { status, body: ResponseBody.errorResponse(message, normalizedError, details, meta) };
};

export const sendSuccessResponse = (
  res: Response,
  status: number = StatusCodes.OK,
  data?: unknown,
  message: string = ReasonPhrases.OK,
  options: SuccessOptions = {}
) => {
  const payload = buildSuccessPayload(status, data, message, options);
  if (payload.noBody) {
    return res.status(payload.status).send();
  }
  return res.status(payload.status).json(payload.body);
};

export const sendErrorResponse = (
  res: Response,
  status: number = StatusCodes.INTERNAL_SERVER_ERROR,
  message: string = ReasonPhrases.INTERNAL_SERVER_ERROR,
  error?: unknown,
  options: ErrorOptions = {}
) => {
  const payload = buildErrorPayload(status, message, error, options);
  return res.status(payload.status).json(payload.body);
};

