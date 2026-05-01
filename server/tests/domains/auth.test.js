const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');
const bcrypt = require('bcryptjs');

describe('Auth Domain API', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should successfully log in admin user and return tokens', async () => {
            const mockUser = {
                id: 1,
                username: 'admin',
                password: await bcrypt.hash('password123', 10),
                role: 'admin',
                status: 'active'
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.username).toBe('admin');
        });

        it('should reject incorrect password with 401', async () => {
            const mockUser = {
                id: 1,
                username: 'admin',
                password: await bcrypt.hash('password123', 10),
                role: 'admin',
                status: 'active'
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should reject nonexistent username with 401', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nobody', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });
    });

    describe('GET /api/auth/users', () => {
        it('should fetch all users successfully', async () => {
            const mockUsers = [
                { id: 1, username: 'admin', role: 'admin' },
                { id: 2, username: 'cashier', role: 'cashier' }
            ];

            prisma.user.findMany.mockResolvedValue(mockUsers);

            const res = await request(app).get('/api/auth/users');

            // The controller uses format: 'raw', so the array IS the body!
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/users', () => {
        it('should create a new user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 3,
                username: 'newuser',
                role: 'cashier',
                status: 'active'
            });

            const res = await request(app)
                .post('/api/auth/users')
                .send({
                    username: 'newuser',
                    password: 'password123',
                    role: 'cashier'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.username).toBe('newuser'); // Merge format
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should fail if user already exists', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'existing' });

            const res = await request(app)
                .post('/api/auth/users')
                .send({
                    username: 'existing',
                    password: 'password123',
                    role: 'cashier'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Username already exists');
        });
    });

    describe('DELETE /api/auth/users/:id', () => {
        it('should delete user successfully', async () => {
            // Must return a user to bypass getUserById check first
            prisma.user.findUnique.mockResolvedValue({ id: 2, username: 'victim' });
            prisma.user.delete.mockResolvedValue({ id: 2 });

            const res = await request(app).delete('/api/auth/users/2');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
        });
    });

    describe('POST /api/auth/verify-admin', () => {
        it('should successfully verify admin credentials', async () => {
            const mockAdminArray = [{
                id: 1,
                username: 'admin',
                password: await bcrypt.hash('secret', 10),
                role: 'admin'
            }];

            // It calls findMany internally
            prisma.user.findMany.mockResolvedValue(mockAdminArray);

            const res = await request(app)
                .post('/api/auth/verify-admin')
                .send({ password: 'secret' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/auth/complete-onboarding', () => {
        it('creates shop, updates admin password, and sets onboardingVersion', async () => {
            prisma.shop.findFirst.mockResolvedValue(null);
            prisma.shop.create.mockResolvedValue({ id: 1, name: 'Test Shop' });
            prisma.user.findFirst.mockResolvedValue({ id: 1, role: 'admin', password: 'hashed' });
            prisma.user.update.mockResolvedValue({ id: 1 });
            prisma.setting.upsert.mockResolvedValue({});
            prisma.setting.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation((cb) => cb(prisma));

            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ shopName: 'My Shop', adminPassword: 'securePass123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.shop.create).toHaveBeenCalled();
            expect(prisma.user.update).toHaveBeenCalled();
            expect(prisma.setting.upsert).toHaveBeenCalledWith(
                expect.objectContaining({ where: { key: 'onboardingVersion' } })
            );
            expect(prisma.setting.upsert).toHaveBeenCalledWith(
                expect.objectContaining({ where: { key: 'posShopName' } })
            );
            expect(prisma.setting.upsert).toHaveBeenCalledWith(
                expect.objectContaining({ where: { key: 'posReceiptSettings' } })
            );
        });

        it('rejects missing shopName with 400', async () => {
            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ adminPassword: 'securePass123' });

            expect(res.status).toBe(400);
        });

        it('rejects adminPassword shorter than 8 characters with 400', async () => {
            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ shopName: 'My Shop', adminPassword: 'short' });

            expect(res.status).toBe(400);
        });

        it('upserts existing shop instead of creating a duplicate', async () => {
            prisma.shop.findFirst.mockResolvedValue({ id: 1, name: 'Old Name' });
            prisma.shop.update.mockResolvedValue({ id: 1, name: 'New Name' });
            prisma.user.findFirst.mockResolvedValue({ id: 1, role: 'admin', password: 'hashed' });
            prisma.user.update.mockResolvedValue({ id: 1 });
            prisma.setting.upsert.mockResolvedValue({});
            prisma.setting.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation((cb) => cb(prisma));

            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ shopName: 'New Name', adminPassword: 'securePass123' });

            expect(res.status).toBe(200);
            expect(prisma.shop.update).toHaveBeenCalled();
            expect(prisma.shop.create).not.toHaveBeenCalled();
        });

        it('seeds posReceiptSettings with shop name and address from onboarding', async () => {
            prisma.shop.findFirst.mockResolvedValue(null);
            prisma.shop.create.mockResolvedValue({ id: 1, name: 'Corner Store' });
            prisma.user.findFirst.mockResolvedValue({ id: 1, role: 'admin', password: 'hashed' });
            prisma.user.update.mockResolvedValue({ id: 1 });
            prisma.setting.upsert.mockResolvedValue({});
            prisma.setting.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation((cb) => cb(prisma));

            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ shopName: 'Corner Store', address: '42 Market Lane', adminPassword: 'securePass123' });

            expect(res.status).toBe(200);

            const receiptCall = prisma.setting.upsert.mock.calls.find(
                (args) => args[0].where.key === 'posReceiptSettings'
            );
            expect(receiptCall).toBeDefined();
            const written = JSON.parse(receiptCall[0].create.value);
            expect(written.customShopName).toBe('Corner Store');
            expect(written.customHeader).toBe('42 Market Lane');
        });

        it('does not overwrite customHeader when address is empty', async () => {
            prisma.shop.findFirst.mockResolvedValue(null);
            prisma.shop.create.mockResolvedValue({ id: 1, name: 'No Address Shop' });
            prisma.user.findFirst.mockResolvedValue({ id: 1, role: 'admin', password: 'hashed' });
            prisma.user.update.mockResolvedValue({ id: 1 });
            prisma.setting.upsert.mockResolvedValue({});
            prisma.setting.findUnique.mockResolvedValue({
                key: 'posReceiptSettings',
                value: JSON.stringify({ customHeader: 'My Custom Tagline', customShopName: 'Old Name' }),
            });
            prisma.$transaction.mockImplementation((cb) => cb(prisma));

            const res = await request(app)
                .post('/api/auth/complete-onboarding')
                .send({ shopName: 'No Address Shop', adminPassword: 'securePass123' });

            expect(res.status).toBe(200);

            const receiptCall = prisma.setting.upsert.mock.calls.find(
                (args) => args[0].where.key === 'posReceiptSettings'
            );
            const written = JSON.parse(receiptCall[0].update.value);
            expect(written.customHeader).toBe('My Custom Tagline');
            expect(written.customShopName).toBe('No Address Shop');
        });
    });
});
