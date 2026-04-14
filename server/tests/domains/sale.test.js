const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Sale Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/sale', () => {
        it('should checkout and record a sale successfully', async () => {
            // Mock the stock deduction sequence
            prisma.$transaction.mockResolvedValue({
                id: 1,
                invoiceNumber: 'INV-1001',
                totalAmount: 50,
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

            // Based on format: 'merge' pattern
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.sale.invoiceNumber).toBe('INV-1001');
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
