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
            prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 1n }]); // count query
            prisma.$queryRawUnsafe.mockResolvedValueOnce([ // data query
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
            // updateProduct now runs inside $transaction; call the callback with prisma as tx
            prisma.$transaction.mockImplementationOnce((cb) => cb(prisma));

            const res = await request(app)
                .put('/api/products/1')
                .send({ name: 'Diet Cola' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.product.update).toHaveBeenCalled();
        });
    });

    // Stock-ledger coverage. Every batch-creating path must write a matching
    // 'added' StockMovement — the batch row and the ledger must never diverge.
    // These run the real $transaction callback so the service logic executes.
    describe('Batch creation writes the stock ledger', () => {
        const runRealTransaction = () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.batch.create.mockResolvedValue({ id: 10, productId: 1, quantity: 5 });
            prisma.batch.update.mockResolvedValue({ id: 11, productId: 1, quantity: 15 });
        };

        it('records a movement when adding a batch to a tracked product', async () => {
            runRealTransaction();
            prisma.product.findUnique.mockResolvedValue({
                id: 1, batchTrackingEnabled: true, batches: [],
            });

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    productId: 1, batchId: 10, type: 'added', quantity: 5, note: 'Stock added',
                }),
            });
        });

        it('accumulates into the existing batch when tracking is off', async () => {
            runRealTransaction();
            prisma.product.findUnique.mockResolvedValue({
                id: 1,
                batchTrackingEnabled: false,
                batches: [{ id: 11, productId: 1, quantity: 10 }],
            });

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            // Accumulates 10 + 5 rather than creating a second batch.
            expect(prisma.batch.update).toHaveBeenCalledWith({
                where: { id: 11 },
                data: { quantity: 15 },
            });
            expect(prisma.batch.create).not.toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    batchId: 11, type: 'added', quantity: 5, note: 'Stock added',
                }),
            });
        });

        it('creates the first batch when an untracked product has none', async () => {
            runRealTransaction();
            prisma.product.findUnique.mockResolvedValue({
                id: 1, batchTrackingEnabled: false, batches: [],
            });

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ batchId: 10, quantity: 5, note: 'Stock added' }),
            });
        });

        it('records a movement for a new product created with initial stock', async () => {
            runRealTransaction();
            prisma.product.findFirst.mockResolvedValue(null);
            prisma.product.findMany.mockResolvedValue([]);
            prisma.product.create.mockResolvedValue({
                id: 1, name: 'Chips', batchTrackingEnabled: false, batches: [],
            });

            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Chips',
                    initialBatch: { quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 },
                });

            expect(res.status).toBe(200);
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ quantity: 5, note: 'Initial stock' }),
            });
        });

        it('skips the movement for a zero-quantity bulk row', async () => {
            runRealTransaction();
            prisma.product.findFirst.mockResolvedValue(null);
            prisma.product.findMany.mockResolvedValue([]);
            prisma.product.create.mockResolvedValue({
                id: 1, name: 'Zero', batchTrackingEnabled: false,
            });
            prisma.batch.create.mockResolvedValue({ id: 10, productId: 1, quantity: 0 });

            const res = await request(app)
                .post('/api/products/bulk')
                .send({
                    products: [{
                        name: 'Zero',
                        initialBatch: { quantity: 0, mrp: 100, cost_price: 40, selling_price: 60 },
                    }],
                });

            expect(res.status).toBe(200);
            // Batch row still created, but no ledger entry for zero stock.
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).not.toHaveBeenCalled();
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
