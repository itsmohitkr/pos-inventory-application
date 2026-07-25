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

    // Money maths. calculateSaleTotals is shared by the summary, monthly, and
    // daily views — these pin the formula and prove the three views agree.
    //
    // Worked example used throughout:
    //   2 units @ 50, cost 30, 1 returned, discount 5, extraDiscount 3
    //   netQuantity   = 2 - 1              = 1
    //   grossNetTotal = 50 * 1             = 50
    //   grossProfit   = (50 - 30) * 1      = 20
    //   totalDiscount = 5 + 3              = 8
    //   netTotal      = 50 - 8             = 42
    //   profit        = 20 - 8             = 12
    describe('Sale profit calculation', () => {
        const SALE_DATE = new Date('2024-03-15T10:00:00Z');

        const saleFixture = () => ({
            id: 1,
            createdAt: SALE_DATE,
            discount: 5,
            extraDiscount: 3,
            items: [{
                quantity: 2,
                returnedQuantity: 1,
                sellingPrice: 50,
                costPrice: 30,
                mrp: 60,
                batch: { product: { name: 'Cola', barcode: '123', category: 'Beverages' } },
            }],
        });

        const EXPECTED_NET_TOTAL = 42;
        const EXPECTED_PROFIT = 12;

        it('nets out returned quantity and both discounts in the summary report', async () => {
            prisma.sale.findMany.mockResolvedValue([saleFixture()]);
            prisma.expense.findMany.mockResolvedValue([]);
            prisma.purchase.findMany.mockResolvedValue([]);
            prisma.looseSale.findMany.mockResolvedValue([]);

            const res = await request(app).get('/api/reports');

            expect(res.status).toBe(200);
            expect(res.body.totalSales).toBe(EXPECTED_NET_TOTAL);
            expect(res.body.totalProfit).toBe(EXPECTED_PROFIT);
            expect(res.body.sales[0].netTotalAmount).toBe(EXPECTED_NET_TOTAL);
            expect(res.body.sales[0].profit).toBe(EXPECTED_PROFIT);
            // Per-line-item detail stays gross of the sale-level discount.
            expect(res.body.sales[0].items[0].netQuantity).toBe(1);
            expect(res.body.sales[0].items[0].profit).toBe(20);
        });

        it('reports the same figures in the monthly view', async () => {
            prisma.sale.findMany.mockResolvedValue([saleFixture()]);
            prisma.looseSale.findMany.mockResolvedValue([]);

            const res = await request(app).get('/api/reports/monthly?year=2024');

            expect(res.status).toBe(200);
            const march = res.body[2]; // 0-indexed
            expect(march.totalSales).toBe(EXPECTED_NET_TOTAL);
            expect(march.totalProfit).toBe(EXPECTED_PROFIT);
            expect(march.orderCount).toBe(1);
            // Every other month stays empty.
            expect(res.body.filter((m) => m.orderCount > 0)).toHaveLength(1);
        });

        it('reports the same figures in the daily view', async () => {
            prisma.sale.findMany.mockResolvedValue([saleFixture()]);
            prisma.looseSale.findMany.mockResolvedValue([]);

            const res = await request(app).get('/api/reports/daily?year=2024&month=2');

            expect(res.status).toBe(200);
            const day15 = res.body.find((d) => d.day === 15);
            expect(day15.totalSales).toBe(EXPECTED_NET_TOTAL);
            expect(day15.totalProfit).toBe(EXPECTED_PROFIT);
            expect(day15.orderCount).toBe(1);
        });

        it('treats a fully returned sale as zero revenue, discount still applied', async () => {
            const fullyReturned = saleFixture();
            fullyReturned.items[0].returnedQuantity = 2; // all returned
            prisma.sale.findMany.mockResolvedValue([fullyReturned]);
            prisma.expense.findMany.mockResolvedValue([]);
            prisma.purchase.findMany.mockResolvedValue([]);
            prisma.looseSale.findMany.mockResolvedValue([]);

            const res = await request(app).get('/api/reports');

            expect(res.status).toBe(200);
            // netQuantity 0 → gross 0; the 8 discount still subtracts.
            expect(res.body.totalSales).toBe(-8);
            expect(res.body.totalProfit).toBe(-8);
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
