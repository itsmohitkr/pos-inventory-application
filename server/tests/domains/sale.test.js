const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Sale Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/sale', () => {
        it('should checkout and record a sale successfully', async () => {
            prisma.$transaction.mockResolvedValue({
                id: 1,
                totalAmount: 50,
                discount: 0,
                extraDiscount: 0,
                paymentMethod: 'cash',
                customerId: null,
                createdAt: new Date(),
                items: [],
            });

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [
                        { batch_id: 1, quantity: 1, sellingPrice: 50, isFree: false }
                    ],
                    discount: 0,
                    extraDiscount: 0,
                    paymentMethod: 'cash'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.sale.id).toBe(1);
            expect(res.body.sale.totalAmount).toBe(50);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should link sale to customer when customerId is provided', async () => {
            prisma.$transaction.mockResolvedValue({
                id: 2,
                totalAmount: 120,
                discount: 0,
                extraDiscount: 0,
                paymentMethod: 'Cash',
                customerId: 5,
                createdAt: new Date(),
                items: [],
                customer: { id: 5, phone: '9876543210', name: 'Ravi' },
            });

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 2, sellingPrice: 60, isFree: false }],
                    discount: 0,
                    extraDiscount: 0,
                    paymentMethod: 'Cash',
                    customerId: 5,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.sale.customerId).toBe(5);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('POST /api/sale/:id/return', () => {
        it('should refund/void sale and restore inventory', async () => {
            const mockSale = {
                id: 1,
                status: 'completed',
                items: [{ id: 1, productId: 1, batchId: 1, quantity: 1 }]
            };

            prisma.sale.findUnique.mockResolvedValue(mockSale);
            prisma.$transaction.mockResolvedValue({ success: true, processedReturns: 1 });

            const res = await request(app)
                .post('/api/sale/1/return')
                .send({
                    items: [{ saleItemId: 1, quantity: 1 }]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
