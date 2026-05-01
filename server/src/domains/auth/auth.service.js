const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const prisma = require('../../config/prisma');
const { createHttpError } = require('../../shared/error/appError');
const logger = require('../../shared/utils/logger');

const SALT_ROUNDS = 10;

const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const isHashed = (password) => {
  // Bcrypt hashes usually start with $2a$ or $2b$
  return typeof password === 'string' && password.startsWith('$2');
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

  if (!user) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Invalid credentials', {
      error: 'Invalid credentials',
    });
  }

  let isValid = false;
  let needsMigration = false;

  if (isHashed(user.password)) {
    isValid = await bcrypt.compare(password, user.password);
  } else {
    // Hybrid Strategy: Fallback to plain-text for migration
    isValid = user.password === password;
    if (isValid) {
      needsMigration = true;
      logger.info(
        { username },
        'User authenticated with plain-text password. Flagged for migration.'
      );
    }
  }

  if (!isValid) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Invalid credentials', {
      error: 'Invalid credentials',
    });
  }

  if (user.status === 'inactive') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'User account is inactive', {
      error: 'User account is inactive',
    });
  }

  // Lazy migration: hash the plain-text password now
  if (needsMigration) {
    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      logger.info({ username }, 'User password successfully migrated to hashed format.');
    } catch (err) {
      logger.error({ err, username }, 'Failed to migrate user password.');
      // Proceed with login anyway since they are authenticated
    }
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

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
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
  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

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

  let isOldValid = false;
  if (isHashed(user.password)) {
    isOldValid = await bcrypt.compare(oldPassword, user.password);
  } else {
    isOldValid = user.password === oldPassword;
  }

  if (!isOldValid) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Incorrect old password', {
      error: 'Incorrect old password',
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: Number(userId) },
    data: { password: hashedPassword },
  });
};

const wipeDatabase = async ({ username, password }) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Invalid admin credentials', {
      error: 'Invalid admin credentials',
    });
  }

  let isValid = false;
  if (isHashed(user.password)) {
    isValid = await bcrypt.compare(password, user.password);
  } else {
    isValid = user.password === password;
  }

  if (!isValid || user.role !== 'admin') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Invalid admin credentials', {
      error: 'Invalid admin credentials',
    });
  }

  await prisma.$transaction(async (tx) => {
    const deleteTable = async (tableName) => {
      try {
        await tx[tableName].deleteMany({});
      } catch (error) {
        logger.warn({ tableName, error: error.message }, 'Could not wipe table');
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
      logger.warn({ error: error.message }, 'Could not wipe table category');
    }

    try {
      await tx.user.deleteMany({
        where: {
          id: { not: user.id },
        },
      });
    } catch (error) {
      logger.warn({ error: error.message }, 'Could not wipe users');
    }
  });

  return { remainingUser: user.username };
};

const verifyAdmin = async ({ password }) => {
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'admin',
      status: 'active',
    },
  });

  let foundAdmin = null;
  for (const admin of adminUsers) {
    let isValid = false;
    if (isHashed(admin.password)) {
      isValid = await bcrypt.compare(password, admin.password);
    } else {
      isValid = admin.password === password;
    }

    if (isValid) {
      foundAdmin = admin;
      break;
    }
  }

  if (!foundAdmin) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Incorrect admin password', {
      error: 'Incorrect admin password',
    });
  }

  // Optional: auto-migrate the admin if they used plain-text
  if (!isHashed(foundAdmin.password)) {
    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: foundAdmin.id },
        data: { password: hashedPassword },
      });
    } catch (err) {
      logger.error({ err, adminId: foundAdmin.id }, 'Failed to migrate admin password.');
    }
  }
};

const ONBOARDING_VERSION = 1;

const completeOnboarding = async ({ shopName, address, phone, phone2, email, gst, logo, adminPassword }) => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.shop.findFirst();
    if (existing) {
      await tx.shop.update({
        where: { id: existing.id },
        data: { name: shopName, address, phone, phone2, email, gst, logo },
      });
    } else {
      await tx.shop.create({
        data: { name: shopName, address, phone, phone2, email, gst, logo },
      });
    }

    const admin = await tx.user.findFirst({ where: { role: 'admin' } });
    if (!admin) {
      throw createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'No admin user found');
    }
    const hashed = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await tx.user.update({ where: { id: admin.id }, data: { password: hashed } });

    await tx.setting.upsert({
      where:  { key: 'onboardingVersion' },
      create: { key: 'onboardingVersion', value: String(ONBOARDING_VERSION) },
      update: { value: String(ONBOARDING_VERSION) },
    });
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
