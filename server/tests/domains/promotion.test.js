const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Promotion Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/promotions', () => {
        it('should create a promotion successfully', async () => {
            prisma.$transaction.mockResolvedValue({ id: 1, name: 'Summer Sale' });

            const res = await request(app)
                .post('/api/promotions')
                .send({
                    name: 'Summer Sale',
                    startDate: '2023-06-01',
                    endDate: '2023-08-01',
                    items: [{ productId: 1, promoPrice: 90 }],
                    isActive: true
                });

            // Based on format: 'raw'
            expect(res.status).toBe(201);
            expect(res.body.id).toBe(1);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('GET /api/promotions', () => {
        it('should fetch all promotions', async () => {
            prisma.promotion.findMany.mockResolvedValue([
                { id: 1, type: 'discount_percentage', value: 10 }
            ]);

            const res = await request(app).get('/api/promotions');

            // Based on format: 'raw'
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(prisma.promotion.findMany).toHaveBeenCalled();
        });
    });

    describe('GET /api/promotions/effective-price/:productId', () => {
        it('should calculate effective price for product', async () => {
            // Mocking service layer DB lookups to mimic product with promo
            prisma.promotion.findMany.mockResolvedValue([
                { items: [{ promoPrice: 90 }] }
            ]);

            const res = await request(app).get('/api/promotions/effective-price/1');

            // format: 'raw' returns obj { promoPrice }
            expect(res.status).toBe(200);
            expect(res.body.promoPrice).toBe(90);
        });
    });
});
