const { StatusCodes } = require('http-status-codes');
const prisma = require('../../config/prisma');
const { createHttpError } = require('../../shared/error/appError');

const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: Number(userId) },
  });
};

const login = async ({ username, password }) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Invalid credentials', {
      error: 'Invalid credentials',
    });
  }

  if (user.status === 'inactive') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'User account is inactive', {
      error: 'User account is inactive',
    });
  }

  return sanitizeUser(user);
};

const getProfile = async (userId) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  return sanitizeUser(user);
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      password: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const createUser = async ({ username, password, role }) => {
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw createHttpError(StatusCodes.BAD_REQUEST, 'Username already exists', {
      error: 'Username already exists',
    });
  }

  return prisma.user.create({
    data: {
      username,
      password,
      role: role || 'cashier',
      status: 'active',
    },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};

const updateUser = async (userId, payload) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  const { role, status, password } = payload;
  const updateData = {};

  if (role) updateData.role = role;
  if (status) updateData.status = status;
  if (password) updateData.password = password;

  return prisma.user.update({
    where: { id: Number(userId) },
    data: updateData,
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

const deleteUser = async (userId) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  await prisma.user.delete({
    where: { id: Number(userId) },
  });
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  if (user.password !== oldPassword) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Incorrect old password', {
      error: 'Incorrect old password',
    });
  }

  await prisma.user.update({
    where: { id: Number(userId) },
    data: { password: newPassword },
  });
};

const wipeDatabase = async ({ username, password }) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password || user.role !== 'admin') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Invalid admin credentials', {
      error: 'Invalid admin credentials',
    });
  }

  await prisma.$transaction(async (tx) => {
    const deleteTable = async (tableName) => {
      try {
        await tx[tableName].deleteMany({});
      } catch (error) {
        console.warn(`Could not wipe table ${tableName}: ${error.message}`);
      }
    };

    await deleteTable('saleItem');
    await deleteTable('sale');
    await deleteTable('looseSale');
    await deleteTable('promotionItem');
    await deleteTable('promotion');
    await deleteTable('stockMovement');
    await deleteTable('batch');
    await deleteTable('product');
    await deleteTable('purchaseItem');
    await deleteTable('purchase');
    await deleteTable('expense');

    try {
      await tx.category.deleteMany({ where: { parentId: { not: null } } });
      await tx.category.deleteMany({});
    } catch (error) {
      console.warn(`Could not wipe table category: ${error.message}`);
    }

    try {
      await tx.user.deleteMany({
        where: {
          id: { not: user.id },
        },
      });
    } catch (error) {
      console.warn(`Could not wipe users: ${error.message}`);
    }
  });

  return { remainingUser: user.username };
};

const verifyAdmin = async ({ password }) => {
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'admin',
      status: 'active',
      password,
    },
  });

  if (!adminUser) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Incorrect admin password', {
      error: 'Incorrect admin password',
    });
  }
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
};
