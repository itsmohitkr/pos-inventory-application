const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Report Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/reports', () => {
        it('should aggregate date-ranged sales report', async () => {
            // sale.findMany with deep includes
            prisma.sale.findMany.mockResolvedValue([
                {
                    id: 1,
                    discount: 0,
                    extraDiscount: 0,
                    items: [
                        {
                            quantity: 2,
                            returnedQuantity: 0,
                            sellingPrice: 50,
                            costPrice: 30,
                            mrp: 60,
                            batch: { product: { name: 'Cola', barcode: '123', category: 'Beverages' } }
                        }
                    ]
                }
            ]);
            // expense, purchase, looseSale findMany
            prisma.expense.findMany.mockResolvedValue([{ amount: 20 }]);
            prisma.purchase.findMany.mockResolvedValue([{ totalAmount: 50 }]);
            prisma.looseSale.findMany.mockResolvedValue([{ price: 10 }]);

            const res = await request(app).get('/api/reports?startDate=2023-01-01&endDate=2023-12-31');

            // format: 'raw'
            expect(res.status).toBe(200);
            expect(res.body.totalOrders).toBe(1);
            expect(res.body.totalExpenses).toBe(20);
            expect(res.body.totalPurchases).toBe(50);
        });
    });

    describe('GET /api/reports/low-stock', () => {
        it('should return products below their low stock threshold', async () => {
            prisma.product.findMany.mockResolvedValue([
                {
                    id: 1,
                    name: 'Low Cola',
                    isDeleted: false,
                    lowStockThreshold: 10,
                    batches: [{ quantity: 3, mrp: 50 }]
                }
            ]);

            const res = await request(app).get('/api/reports/low-stock');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Low Cola');
            expect(res.body[0].totalQuantity).toBe(3);
        });
    });

    describe('GET /api/reports/top-selling', () => {
        it('should return top products by quantity sold', async () => {
            // saleItem.groupBy returns array keyed by batchId
            prisma.saleItem.groupBy.mockResolvedValue([
                { batchId: 10, _sum: { quantity: 100 } }
            ]);
            // batch.findMany maps batchId -> productId
            prisma.batch.findMany.mockResolvedValue([
                { id: 10, productId: 1 }
            ]);

            const res = await request(app).get('/api/reports/top-selling');

            // format: 'raw' — service returns a plain object { [productId]: totalQty }
            expect(res.status).toBe(200);
            expect(res.body['1']).toBe(100);
        });
    });
});
