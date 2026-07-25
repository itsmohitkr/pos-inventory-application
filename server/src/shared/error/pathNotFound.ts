import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import { sendErrorResponse } from '../utils/helper/responseHelpers';

const pathNotFound = (req: Request, res: Response) => {
  return sendErrorResponse(
    res,
    StatusCodes.NOT_FOUND,
    `Cannot ${req.method} ${req.originalUrl}`,
    'Path Not Found'
  );
};

export = pathNotFound;
