import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

describe('Expense Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/expenses', () => {
        it('should create an expense with raw format', async () => {
            prisma.$transaction.mockResolvedValue(asMock({
                id: 1,
                amount: 100,
                category: 'Utilities',
                paymentStatus: 'paid'
            }));

            const res = await request(app)
                .post('/api/expenses')
                .send({
                    amount: 100,
                    category: 'Utilities',
                    description: 'Electric bill',
                    paidAmount: 100,
                    paymentMethod: 'cash',
                    paymentStatus: 'paid'
                });

            expect(res.status).toBe(201);
            // Format is raw
            expect(res.body.id).toBe(1);
            expect(res.body.amount).toBe(100);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('GET /api/expenses', () => {
        it('should fetch expenses collection successfully', async () => {
            // Mock result returned by service
            prisma.expense.findMany.mockResolvedValue(asMock([{ id: 1, category: 'Utilities', payments: [] }]));
            prisma.expense.count.mockResolvedValue(asMock(1));

            const res = await request(app).get('/api/expenses');

            expect(res.status).toBe(200);
            // Format is raw: the service returns bare array
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
    });

    describe('POST /api/expenses/:id/payments', () => {
        it('should add a payment to an expense', async () => {
            prisma.expense.findUnique.mockResolvedValue(asMock({ id: 1, amount: 100, paidAmount: 0 }));
            prisma.$transaction.mockResolvedValue(asMock({ id: 9, amount: 50 }));

            const res = await request(app)
                .post('/api/expenses/1/payments')
                .send({ amount: 50, paymentMethod: 'cash' });

            expect(res.status).toBe(201);
            expect(res.body.amount).toBe(50);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
