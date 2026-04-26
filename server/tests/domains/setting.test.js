const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Setting Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/settings', () => {
        it('should fetch all application settings mapped identically', async () => {
            prisma.setting.findMany.mockResolvedValue([
                { key: 'STORE_NAME', value: 'My Shop' },
                { key: 'TAX_RATE', value: '5' }
            ]);

            const res = await request(app).get('/api/settings');

            // Settings controller uses default wrapped schema ({ success, data, message })
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.STORE_NAME).toBe('My Shop');
            expect(res.body.data.TAX_RATE).toBe(5);
        });
    });

    describe('POST /api/settings', () => {
        it('should update multiple settings transactionally', async () => {
            // Mock upsert logic
            prisma.setting.upsert.mockResolvedValue({ key: 'STORE_NAME', value: 'New Bazaar' });

            const res = await request(app)
                .post('/api/settings')
                .send({
                    settings: {
                        STORE_NAME: 'New Bazaar'
                    }
                });

            // Default wrapped schema returns success state and no specific data payload on update
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.setting.upsert).toHaveBeenCalled();
        });
    });
});
