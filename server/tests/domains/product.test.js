const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Product Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.product.findMany.mockResolvedValue([]);
    });

    describe('GET /api/products', () => {
        it('should fetch paginated products', async () => {
            prisma.$queryRaw.mockResolvedValueOnce([{ count: 1n }]); // count query
            prisma.$queryRaw.mockResolvedValueOnce([ // data query
                {
                    id: 1, name: 'Cola', barcode: '123', category: null,
                    batchTrackingEnabled: false, lowStockWarningEnabled: false,
                    total_stock: 10, total_cost: 100, total_selling: 150
                }
            ]);

            const res = await request(app).get('/api/products?page=1&limit=10');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination.total).toBe(1);
        });
    });

    describe('POST /api/products', () => {
        it('should create new product with initial batch', async () => {
            prisma.product.findFirst.mockResolvedValue(null); // Barcode check
            prisma.product.findMany.mockResolvedValue([]);    // Category background sync
            prisma.$transaction.mockResolvedValue({
                id: 2,
                name: 'Chips',
                sku: 'CHP-123'
            });

            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Chips',
                    sku: 'CHP-123',
                    barcode: '1234567890',
                    basePrice: 50,
                    initialStock: 100,
                    costPrice: 30
                });

            // Product creation via Prisma transaction logic returns 200 OK wrapper
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.id).toBe(2);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product details', async () => {
            prisma.product.findFirst.mockResolvedValue(null); // Barcode check
            prisma.product.findMany.mockResolvedValue([]);    // Category background sync
            prisma.product.update.mockResolvedValue({ id: 1, name: 'Diet Cola' });

            const res = await request(app)
                .put('/api/products/1')
                .send({ name: 'Diet Cola' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.product.update).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should soft-delete product', async () => {
            prisma.product.update.mockResolvedValue({ id: 1, isDeleted: true });

            const res = await request(app).delete('/api/products/1');

            expect(res.status).toBe(200);
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({ isDeleted: true })
            });
        });
    });
});
