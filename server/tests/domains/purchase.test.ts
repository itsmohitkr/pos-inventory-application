import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

describe('Purchase Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/purchases', () => {
        it('should create a purchase with transaction items successfully', async () => {
            prisma.$transaction.mockResolvedValue(asMock({
                id: 1,
                vendor: 'Distributor A',
                totalAmount: 1000
            }));

            const res = await request(app)
                .post('/api/purchases')
                .send({
                    vendor: 'Distributor A',
                    totalAmount: 1000,
                    paidAmount: 1000,
                    items: [{ productId: 1, quantity: 10, costPrice: 100 }]
                });

            // Format is raw
            expect(res.status).toBe(201);
            expect(res.body.vendor).toBe('Distributor A');
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('GET /api/purchases', () => {
        it('should fetch purchases history list', async () => {
            prisma.purchase.findMany.mockResolvedValue(asMock([{ id: 1, vendor: 'Distributor A', payments: [] }]));
            prisma.purchase.count.mockResolvedValue(asMock(1));

            const res = await request(app).get('/api/purchases');

            expect(res.status).toBe(200);
            // Service returns bare array directly to body (raw mode)
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
    });

    describe('PUT /api/purchases/payments/:id', () => {
        it('should update a payment log independently', async () => {
            // NB: the real delegate is `purchasePayment` (there is no `Payment`
            // model). This mock is inert either way — `$transaction` below is
            // mocked to resolve directly, so the callback that would call
            // `tx.purchasePayment.findUnique` never runs — but the property
            // name was wrong even for a dead mock, which strict typing on
            // DeepMockProxy<PrismaClient> now catches.
            prisma.purchasePayment.findUnique.mockResolvedValue(asMock({ id: 5, amount: 500, purchaseId: 1 }));
            prisma.purchase.findUnique.mockResolvedValue(asMock({ id: 1, totalAmount: 1000, paidAmount: 500 }));

            // Process transaction update
            prisma.$transaction.mockResolvedValue(asMock({ id: 5, amount: 500 }));

            const res = await request(app)
                .put('/api/purchases/payments/5')
                .send({ amount: 500, note: 'Correction' });

            expect(res.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(res.body.amount).toBe(500);
        });
    });
});
