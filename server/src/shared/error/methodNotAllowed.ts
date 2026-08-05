import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import type { Request, Response } from 'express';
import { sendErrorResponse } from '../utils/helper/responseHelpers';

const methodNotAllowed = (req: Request, res: Response) => {
  return sendErrorResponse(
    res,
    StatusCodes.METHOD_NOT_ALLOWED,
    `Method ${req.method} not allowed for ${req.originalUrl}`,
    ReasonPhrases.METHOD_NOT_ALLOWED
  );
};

export = methodNotAllowed;
