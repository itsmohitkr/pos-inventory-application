const { StatusCodes } = require('http-status-codes');
const authService = require('./auth.service');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const login = async (req, res) => {
  const user = await authService.login(req.body);

  return sendSuccessResponse(res, StatusCodes.OK, user, 'Login successful', {
    format: 'merge',
  });
};

const getProfile = async (req, res) => {
  const user = await authService.getProfile(req.query.userId);

  return sendSuccessResponse(res, StatusCodes.OK, user, 'Profile fetched successfully', {
    format: 'merge',
  });
};

const getAllUsers = async (_req, res) => {
  const users = await authService.getAllUsers();

  return sendSuccessResponse(res, StatusCodes.OK, users, 'Users fetched successfully', {
    format: 'raw',
  });
};

const createUser = async (req, res) => {
  const user = await authService.createUser(req.body);

  return sendSuccessResponse(res, StatusCodes.CREATED, user, 'User created successfully', {
    format: 'merge',
  });
};

const updateUser = async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);

  return sendSuccessResponse(res, StatusCodes.OK, user, 'User updated successfully', {
    format: 'merge',
  });
};

const deleteUser = async (req, res) => {
  await authService.deleteUser(req.params.id);

  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'User deleted successfully');
};

const changePassword = async (req, res) => {
  await authService.changePassword(req.params.id, req.body);

  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Password changed successfully');
};

const wipeDatabase = async (req, res) => {
  const result = await authService.wipeDatabase(req.body);

  return sendSuccessResponse(
    res,
    StatusCodes.OK,
    result,
    'Database wiped successfully. All data deleted except your admin account.',
    { format: 'merge' }
  );
};

const verifyAdmin = async (req, res) => {
  await authService.verifyAdmin(req.body);

  return sendSuccessResponse(res, StatusCodes.OK, undefined, 'Admin verified');
};

const completeOnboarding = async (req, res) => {
  await authService.completeOnboarding(req.body);

  return sendSuccessResponse(res, StatusCodes.OK, { success: true }, 'Onboarding completed', {
    format: 'merge',
  });
};

module.exports = {
  login,
  getProfile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  wipeDatabase,
  verifyAdmin,
  completeOnboarding,
};
