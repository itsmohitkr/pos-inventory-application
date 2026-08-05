import bcrypt = require('bcryptjs');
import { StatusCodes } from 'http-status-codes';
import prisma = require('../../config/prisma');
import type { Prisma, User } from '@prisma/client';
import { createHttpError } from '../../shared/error/appError';
import logger = require('../../shared/utils/logger');
import { getErrorMessage } from '../../shared/utils/errorMessage';
import { DEFAULT_RECEIPT_SETTINGS } from '../../config/constants';
import { issueToken } from './adminTokens';
import type {
  ChangePasswordInput,
  CompleteOnboardingInput,
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  VerifyAdminInput,
  WipeDatabaseInput,
} from './auth.validation';

const SALT_ROUNDS = 10;

/** A user with the password stripped — what every auth endpoint returns. */
export type SafeUser = Omit<User, 'password'>;

const sanitizeUser = (user: User): SafeUser => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const isHashed = (password: string | null | undefined): boolean => {
  // Bcrypt hashes usually start with $2a$ or $2b$
  return typeof password === 'string' && password.startsWith('$2');
};

const getUserById = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
  });
};

const login = async ({ username, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Invalid credentials', {
      error: 'Invalid credentials',
    });
  }

  let isValid: boolean;
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

  const safeUser = sanitizeUser(user);

  // Admins get an elevation token here so a direct admin login works without a
  // second password prompt. Non-admins get none — there is nothing to elevate.
  if (user.role === 'admin') {
    const { token, expiresAt } = await issueToken(user);
    return { ...safeUser, adminToken: token, adminTokenExpiresAt: expiresAt };
  }

  return safeUser;
};

const getProfile = async (userId: number) => {
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

const createUser = async ({ username, password, role }: CreateUserInput) => {
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

const updateUser = async (userId: number, payload: UpdateUserInput) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  const { role, status, password } = payload;
  const updateData: Prisma.UserUpdateInput = {};

  if (role) updateData.role = role;
  if (status) updateData.status = status;
  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  return prisma.user.update({
    where: { id: userId },
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

const deleteUser = async (userId: number) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  await prisma.user.delete({
    where: { id: userId },
  });
};

const changePassword = async (userId: number, { oldPassword, newPassword }: ChangePasswordInput) => {
  const user = await getUserById(userId);

  if (!user) {
    throw createHttpError(StatusCodes.NOT_FOUND, 'User not found', {
      error: 'User not found',
    });
  }

  const isOldValid = isHashed(user.password)
    ? await bcrypt.compare(oldPassword, user.password)
    : user.password === oldPassword;

  if (!isOldValid) {
    throw createHttpError(StatusCodes.UNAUTHORIZED, 'Incorrect old password', {
      error: 'Incorrect old password',
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const wipeDatabase = async ({ username, password }: WipeDatabaseInput) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Invalid admin credentials', {
      error: 'Invalid admin credentials',
    });
  }

  const isValid = isHashed(user.password)
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!isValid || user.role !== 'admin') {
    throw createHttpError(StatusCodes.FORBIDDEN, 'Invalid admin credentials', {
      error: 'Invalid admin credentials',
    });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Models are addressed dynamically here; Prisma's client type has no
    // index signature, so the lookup is widened deliberately.
    const deleteTable = async (tableName: string) => {
      try {
        await (tx as Record<string, any>)[tableName].deleteMany({});
      } catch (error) {
        logger.warn({ tableName, error: getErrorMessage(error) }, 'Could not wipe table');
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
    await deleteTable('customer');

    try {
      await tx.category.deleteMany({ where: { parentId: { not: null } } });
      await tx.category.deleteMany({});
    } catch (error) {
      logger.warn({ error: getErrorMessage(error) }, 'Could not wipe table category');
    }

    try {
      await tx.user.deleteMany({
        where: {
          id: { not: user.id },
        },
      });
    } catch (error) {
      logger.warn({ error: getErrorMessage(error) }, 'Could not wipe users');
    }
  });

  return { remainingUser: user.username };
};

const verifyAdmin = async ({ password }: VerifyAdminInput) => {
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'admin',
      status: 'active',
    },
  });

  let foundAdmin: User | null = null;
  for (const admin of adminUsers) {
    const isValid = isHashed(admin.password)
      ? await bcrypt.compare(password, admin.password)
      : admin.password === password;

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

  // The token is what makes this elevation mean something server-side. Before
  // it existed, verifyAdmin only told the renderer "yes", and the renderer set
  // role: 'admin' in localStorage — which the user could have done themselves.
  return issueToken(foundAdmin);
};

const ONBOARDING_VERSION = 1;

/**
 * This endpoint resets the admin password and is unauthenticated, because it
 * must be callable before any admin exists to authenticate against.
 *
 * Without this guard it stays callable forever: any local caller — a cashier
 * using the app's own devtools — could POST here and take over the owner's
 * admin account, defeating the admin/cashier separation the rest of the app
 * relies on (admin elevation, wipe-database, user management).
 *
 * Must run inside the same transaction as the writes below it, so two
 * concurrent calls cannot both pass it.
 */
const assertNotOnboarded = async (tx: Prisma.TransactionClient) => {
  const alreadyOnboarded = await tx.setting.findUnique({
    where: { key: 'onboardingVersion' },
  });
  if (alreadyOnboarded) {
    throw createHttpError(
      StatusCodes.FORBIDDEN,
      'Onboarding has already been completed',
      { error: 'Onboarding has already been completed' }
    );
  }
};

const upsertShop = async (
  tx: Prisma.TransactionClient,
  shop: Pick<CompleteOnboardingInput, 'shopName' | 'address' | 'phone' | 'phone2' | 'email' | 'gst' | 'logo'>
) => {
  const { shopName, address, phone, phone2, email, gst, logo } = shop;
  const existing = await tx.shop.findFirst();
  const data = { name: shopName, address, phone, phone2, email, gst, logo };
  if (existing) {
    await tx.shop.update({ where: { id: existing.id }, data });
  } else {
    await tx.shop.create({ data });
  }
};

const resetAdminPassword = async (tx: Prisma.TransactionClient, hashedPassword: string) => {
  const admin = await tx.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    throw createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'No admin user found');
  }
  await tx.user.update({ where: { id: admin.id }, data: { password: hashedPassword } });

  await tx.setting.upsert({
    where: { key: 'onboardingVersion' },
    create: { key: 'onboardingVersion', value: String(ONBOARDING_VERSION) },
    update: { value: String(ONBOARDING_VERSION) },
  });
};

/** Syncs the flat metadata Setting keys AccountDetailsDialog and the receipt read directly. */
const syncShopMetadataSettings = async (
  tx: Prisma.TransactionClient,
  shop: Pick<CompleteOnboardingInput, 'shopName' | 'address' | 'phone' | 'phone2' | 'email' | 'gst'>
) => {
  const { shopName, address, phone, phone2, email, gst } = shop;
  const metadataUpserts = [
    { key: 'posShopName', value: shopName },
    { key: 'shopAddress', value: address || '' },
    { key: 'shopMobile', value: phone || '' },
    { key: 'shopMobile2', value: phone2 || '' },
    { key: 'shopEmail', value: email || '' },
    { key: 'shopGST', value: gst || '' },
  ].map(({ key, value }) =>
    tx.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  );
  await Promise.all(metadataUpserts);
};

/** Seeds posReceiptSettings, preserving any existing customisations. */
const seedReceiptSettings = async (
  tx: Prisma.TransactionClient,
  shop: Pick<CompleteOnboardingInput, 'shopName' | 'address'>
) => {
  const { shopName, address } = shop;
  const existingReceiptSetting = await tx.setting.findUnique({
    where: { key: 'posReceiptSettings' },
  });
  const existingReceipt = existingReceiptSetting
    ? JSON.parse(existingReceiptSetting.value)
    : {};
  const updatedReceipt = {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...existingReceipt,
    customShopName: shopName,
    ...(address ? { customHeader: address } : {}),
  };
  await tx.setting.upsert({
    where: { key: 'posReceiptSettings' },
    create: { key: 'posReceiptSettings', value: JSON.stringify(updatedReceipt) },
    update: { value: JSON.stringify(updatedReceipt) },
  });
};

const completeOnboarding = async (input: CompleteOnboardingInput) => {
  const hashed = await bcrypt.hash(input.adminPassword, SALT_ROUNDS);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await assertNotOnboarded(tx);
    await upsertShop(tx, input);
    await resetAdminPassword(tx, hashed);
    await syncShopMetadataSettings(tx, input);
    await seedReceiptSettings(tx, input);
  });
};

export {
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
