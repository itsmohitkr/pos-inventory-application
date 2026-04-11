const prisma = require('../../config/prisma');
const { createHttpError } = require('../../shared/error/appError');
const { sendSuccessResponse } = require('../../shared/utils/helper/responseHelpers');

const login = async (req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user || user.password !== password) {
        throw createHttpError(401, 'Invalid credentials', {
            error: 'Invalid credentials'
        });
    }

    if (user.status === 'inactive') {
        throw createHttpError(403, 'User account is inactive', {
            error: 'User account is inactive'
        });
    }

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccessResponse(res, 200, userWithoutPassword, 'Login successful', {
        format: 'merge'
    });
};

const getProfile = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(req.query.userId) }
    });

    if (!user) {
        throw createHttpError(404, 'User not found', {
            error: 'User not found'
        });
    }

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccessResponse(res, 200, userWithoutPassword, 'Profile fetched successfully', {
        format: 'merge'
    });
};

const getAllUsers = async (_req, res) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            password: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return sendSuccessResponse(res, 200, users, 'Users fetched successfully', {
        format: 'raw'
    });
};

const createUser = async (req, res) => {
    const { username, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        throw createHttpError(400, 'Username already exists', {
            error: 'Username already exists'
        });
    }

    const user = await prisma.user.create({
        data: {
            username,
            password,
            role: role || 'cashier',
            status: 'active'
        },
        select: {
            id: true,
            username: true,
            role: true,
            status: true,
            createdAt: true
        }
    });

    return sendSuccessResponse(res, 201, user, 'User created successfully', {
        format: 'merge'
    });
};

const updateUser = async (req, res) => {
    const userId = Number(req.params.id);
    const { role, status, password } = req.body;

    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) updateData.password = password;

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            username: true,
            role: true,
            status: true,
            updatedAt: true
        }
    });

    return sendSuccessResponse(res, 200, user, 'User updated successfully', {
        format: 'merge'
    });
};

const deleteUser = async (req, res) => {
    const userId = Number(req.params.id);

    await prisma.user.delete({
        where: { id: userId }
    });

    return sendSuccessResponse(res, 200, undefined, 'User deleted successfully');
};

const changePassword = async (req, res) => {
    const userId = Number(req.params.id);
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw createHttpError(404, 'User not found', {
            error: 'User not found'
        });
    }

    if (user.password !== oldPassword) {
        throw createHttpError(401, 'Incorrect old password', {
            error: 'Incorrect old password'
        });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { password: newPassword }
    });

    return sendSuccessResponse(res, 200, undefined, 'Password changed successfully');
};

const wipeDatabase = async (req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user || user.password !== password || user.role !== 'admin') {
        throw createHttpError(403, 'Invalid admin credentials', {
            error: 'Invalid admin credentials'
        });
    }

    await prisma.$transaction(async (tx) => {
        const deleteTable = async (tableName) => {
            try {
                await tx[tableName].deleteMany({});
            } catch (e) {
                console.warn(`Could not wipe table ${tableName}: ${e.message}`);
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
        } catch (e) {
            console.warn(`Could not wipe table category: ${e.message}`);
        }

        try {
            await tx.user.deleteMany({
                where: {
                    id: { not: user.id }
                }
            });
        } catch (e) {
            console.warn(`Could not wipe users: ${e.message}`);
        }
    });

    return sendSuccessResponse(
        res,
        200,
        { remainingUser: user.username },
        'Database wiped successfully. All data deleted except your admin account.',
        { format: 'merge' }
    );
};

const verifyAdmin = async (req, res) => {
    const { password } = req.body;

    const adminUser = await prisma.user.findFirst({
        where: {
            role: 'admin',
            status: 'active',
            password
        }
    });

    if (!adminUser) {
        throw createHttpError(401, 'Incorrect admin password', {
            error: 'Incorrect admin password'
        });
    }

    return sendSuccessResponse(res, 200, undefined, 'Admin verified');
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
    verifyAdmin
};
