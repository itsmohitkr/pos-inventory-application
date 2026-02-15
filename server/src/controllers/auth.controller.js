const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Simple password check (in production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ error: 'User account is inactive' });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
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

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
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

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old and new password required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.password !== oldPassword) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: newPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

const wipeDatabase = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Admin credentials required' });
        }

        // Verify admin credentials
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || user.password !== password || user.role !== 'admin') {
            return res.status(403).json({ error: 'Invalid admin credentials' });
        }

        // Delete all data in order (respecting foreign key constraints)
        await prisma.$transaction(async (tx) => {
            // Delete sales-related data
            await tx.saleItem.deleteMany({});
            await tx.sale.deleteMany({});

            // Delete stock movements before inventory records
            await tx.stockMovement.deleteMany({});
            
            // Delete inventory data
            await tx.batch.deleteMany({});
            await tx.product.deleteMany({});
            
            // Delete categories (children first to satisfy self-relation)
            await tx.category.deleteMany({ where: { parentId: { not: null } } });
            await tx.category.deleteMany({});
            
            // Delete all users except the admin who initiated
            await tx.user.deleteMany({
                where: {
                    id: { not: user.id }
                }
            });
        });

        res.json({ 
            message: 'Database wiped successfully. All data deleted except your admin account.',
            remainingUser: user.username
        });
    } catch (error) {
        console.error('Wipe database error:', error);
        res.status(500).json({ error: 'Failed to wipe database' });
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
    wipeDatabase
};
