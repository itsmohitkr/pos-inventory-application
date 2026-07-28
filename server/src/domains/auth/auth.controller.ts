import type { Request, Response } from 'express';
import { paramInt, queryInt } from '../../shared/utils/requestParams';
import { StatusCodes } from 'http-status-codes';
import authService = require('./auth.service');
import asyncHandler = require('../../shared/error/asyncHandler');
import { sendSuccessResponse } from '../../shared/utils/helper/responseHelpers';

const login = async (req: Request, res: Response) => {
  const user = await authService.login(req.body);

  return sendSuccessResponse(res, StatusCodes.OK, user, 'Login successful', {
    format: 'merge',
  });
};

const getProfile = async (req: Request, res: Response) => {
  // profileQuerySchema requires a positive integer userId, so validation has
  // already rejected anything unparseable. NaN is the fallback only because
  // req.query cannot be written back with the coerced value (Express 5 makes
  // it a getter), which matches the previous Number(userId) behaviour.
  const user = await authService.getProfile(queryInt(req.query.userId, Number.NaN));

  return sendSuccessResponse(res, StatusCodes.OK, user, 'Profile fetched successfully', {
    format: 'merge',
  });
};

const getAllUsers = async (_req: Request, res: Response) => {
  const users = await authService.getAllUsers();

  return sendSuccessResponse(res, StatusCodes.OK, users, 'Users fetched successfully', {
    format: 'raw',
  });
};

const createUser = async (req: Request, res: Response) => {
  const user = await authService.createUser(req.body);

  return sendSuccessResponse(res, StatusCodes.CREATED, user, 'User created successfully', {
    format: 'merge',
  });
};

const updateUser = async (req: Request, res: Response) => {
  const user = await authService.updateUser(paramInt(req.params.id), req.body);

  return sendSuccessResponse(res, StatusCodes.OK, user, 'User updated successfully', {
    format: 'merge',
  });
};

const deleteUser = async (req: Request, res: Response) => {
  await authService.deleteUser(paramInt(req.params.id));

  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'User deleted successfully');
};

const changePassword = async (req: Request, res: Response) => {
  await authService.changePassword(paramInt(req.params.id), req.body);

  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Password changed successfully');
};

const wipeDatabase = async (req: Request, res: Response) => {
  const result = await authService.wipeDatabase(req.body);

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    result,
    'Database wiped successfully. All data deleted except your admin account.',
    { format: 'merge' }
  );
};

const verifyAdmin = async (req: Request, res: Response) => {
  // The token is the point of this endpoint now — the renderer stores it and
  // sends it back on privileged routes.
  const { token, expiresAt } = await authService.verifyAdmin(req.body);

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    { adminToken: token, adminTokenExpiresAt: expiresAt },
    'Admin verified',
    { format: 'merge' }
  );
};

const completeOnboarding = async (req: Request, res: Response) => {
  await authService.completeOnboarding(req.body);

  return sendSuccessResponse(res, StatusCodes.OK, { success: true }, 'Onboarding completed', {
    format: 'merge',
  });
};

export = {
  login: asyncHandler(login),
  getProfile: asyncHandler(getProfile),
  getAllUsers: asyncHandler(getAllUsers),
  createUser: asyncHandler(createUser),
  updateUser: asyncHandler(updateUser),
  deleteUser: asyncHandler(deleteUser),
  changePassword: asyncHandler(changePassword),
  wipeDatabase: asyncHandler(wipeDatabase),
  verifyAdmin: asyncHandler(verifyAdmin),
  completeOnboarding: asyncHandler(completeOnboarding),
};
