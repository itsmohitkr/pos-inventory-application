import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

describe('Product Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.product.findMany.mockResolvedValue(asMock([]));
    });

    describe('GET /api/products', () => {
        it('should fetch paginated products', async () => {
            prisma.$queryRawUnsafe.mockResolvedValueOnce(asMock([{ count: 1n }])); // count query
            prisma.$queryRawUnsafe.mockResolvedValueOnce(asMock([ // data query
                {
                    id: 1, name: 'Cola', barcode: '123', category: null,
                    batchTrackingEnabled: false, lowStockWarningEnabled: false,
                    total_stock: 10, total_cost: 100, total_selling: 150
                }
            ]));

            const res = await request(app).get('/api/products?page=1&limit=10');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination.total).toBe(1);
        });
    });

    describe('POST /api/products', () => {
        it('should create new product with initial batch', async () => {
            prisma.product.findFirst.mockResolvedValue(null); // Barcode check
            prisma.product.findMany.mockResolvedValue(asMock([]));    // Category background sync
            prisma.$transaction.mockResolvedValue(asMock({
                id: 2,
                name: 'Chips',
                sku: 'CHP-123'
            }));

            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Chips',
                    category: 'Snacks',
                    barcode: '1234567890',
                    initialBatch: { quantity: 100, cost_price: 30, selling_price: 45, mrp: 50 },
                });

            // Product creation via Prisma transaction logic returns 200 OK wrapper
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.id).toBe(2);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should reject product creation when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Incomplete Product',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product details', async () => {
            prisma.product.findFirst.mockResolvedValue(null); // Barcode check
            prisma.product.findMany.mockResolvedValue(asMock([]));    // Category background sync
            prisma.product.update.mockResolvedValue(asMock({ id: 1, name: 'Diet Cola' }));
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
            prisma.batch.create.mockResolvedValue(asMock({ id: 10, productId: 1, quantity: 5 }));
            prisma.batch.update.mockResolvedValue(asMock({ id: 11, productId: 1, quantity: 15 }));
        };

        it('records a movement when adding a batch to a tracked product', async () => {
            runRealTransaction();
            prisma.product.findUnique.mockResolvedValue(asMock({
                id: 1, batchTrackingEnabled: true, batches: [],
            }));

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            expect(res.body.created).toBe(true);
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    productId: 1, batchId: 10, type: 'added', quantity: 5, note: 'Stock added',
                }),
            });
        });

        it('accumulates into the existing batch when tracking is off', async () => {
            runRealTransaction();
            prisma.product.findUnique.mockResolvedValue(asMock({
                id: 1,
                batchTrackingEnabled: false,
                batches: [{ id: 11, productId: 1, quantity: 10 }],
            }));

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            expect(res.body.created).toBe(false);
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
            prisma.product.findUnique.mockResolvedValue(asMock({
                id: 1, batchTrackingEnabled: false, batches: [],
            }));

            const res = await request(app)
                .post('/api/batches')
                .send({ product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 });

            expect(res.status).toBe(201);
            expect(res.body.created).toBe(true);
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ batchId: 10, quantity: 5, note: 'Stock added' }),
            });
        });

        it('records a movement for a new product created with initial stock', async () => {
            runRealTransaction();
            prisma.product.findFirst.mockResolvedValue(null);
            prisma.product.findMany.mockResolvedValue(asMock([]));
            prisma.product.create.mockResolvedValue(asMock({
                id: 1, name: 'Chips', batchTrackingEnabled: false, batches: [],
            }));

            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Chips',
                    category: 'Snacks',
                    barcode: '1234567890',
                    initialBatch: { quantity: 5, mrp: 100, cost_price: 40, selling_price: 60 },
                });

            expect(res.status).toBe(200);
            expect(prisma.stockMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ quantity: 5, note: 'Initial stock' }),
            });
        });

        it('skips the movement for a zero-quantity CSV-imported row', async () => {
            runRealTransaction();
            prisma.product.create.mockResolvedValue(asMock({
                id: 5, name: 'Zero', batchTrackingEnabled: false,
            }));
            prisma.batch.create.mockResolvedValue(asMock({ id: 20, productId: 5, quantity: 0 }));

            const csv = 'name,barcode,category,quantity,mrp,cost_price,selling_price\nZero,,,0,100,40,60\n';

            const res = await request(app)
                .post('/api/products/import')
                .attach('file', Buffer.from(csv), 'products.csv');

            expect(res.status).toBe(200);
            // Batch row still created, but no ledger entry for zero stock.
            expect(prisma.batch.create).toHaveBeenCalled();
            expect(prisma.stockMovement.create).not.toHaveBeenCalled();
        });
    });

    describe('New-batch expiry date validation', () => {
        it('rejects a new batch with a past expiry date', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const res = await request(app)
                .post('/api/batches')
                .send({
                    product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60,
                    expiryDate: pastDate.toISOString().slice(0, 10),
                });

            expect(res.status).toBe(400);
            expect(prisma.batch.create).not.toHaveBeenCalled();
        });

        it('rejects a new batch with an expiry date more than 10 years out', async () => {
            const farFuture = new Date();
            farFuture.setFullYear(farFuture.getFullYear() + 11);

            const res = await request(app)
                .post('/api/batches')
                .send({
                    product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60,
                    expiryDate: farFuture.toISOString().slice(0, 10),
                });

            expect(res.status).toBe(400);
            expect(prisma.batch.create).not.toHaveBeenCalled();
        });

        it('accepts a new batch with a valid future expiry date', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.product.findUnique.mockResolvedValue(asMock({
                id: 1, batchTrackingEnabled: true, batches: [],
            }));
            prisma.batch.create.mockResolvedValue(asMock({ id: 10, productId: 1, quantity: 5 }));

            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            const res = await request(app)
                .post('/api/batches')
                .send({
                    product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60,
                    expiryDate: nextYear.toISOString().slice(0, 10),
                });

            expect(res.status).toBe(201);
            expect(prisma.batch.create).toHaveBeenCalled();
        });

        it('accepts a same-day expiry date regardless of server timezone', async () => {
            // Regression: comparing a date-only string (parsed as UTC midnight)
            // against a locally-computed midnight would wrongly reject "today"
            // in any negative-UTC-offset timezone. Forces the server into one
            // to prove the fix isn't just coincidentally passing under this
            // machine's own timezone.
            const originalTz = process.env.TZ;
            process.env.TZ = 'America/Los_Angeles';
            try {
                prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
                prisma.product.findUnique.mockResolvedValue(asMock({
                    id: 1, batchTrackingEnabled: true, batches: [],
                }));
                prisma.batch.create.mockResolvedValue(asMock({ id: 10, productId: 1, quantity: 5 }));

                const todayDateOnly = new Date().toISOString().slice(0, 10);

                const res = await request(app)
                    .post('/api/batches')
                    .send({
                        product_id: 1, quantity: 5, mrp: 100, cost_price: 40, selling_price: 60,
                        expiryDate: todayDateOnly,
                    });

                expect(res.status).toBe(201);
                expect(prisma.batch.create).toHaveBeenCalled();
            } finally {
                process.env.TZ = originalTz;
            }
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should soft-delete product', async () => {
            prisma.product.update.mockResolvedValue(asMock({ id: 1, isDeleted: true }));

            const res = await request(app).delete('/api/products/1');

            expect(res.status).toBe(200);
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({ isDeleted: true })
            });
        });
    });

    describe('DELETE /api/batches/:id', () => {
        it('rejects deletion while the batch still has stock, regardless of sales history', async () => {
            prisma.batch.findUnique.mockResolvedValue(asMock({
                id: 1, quantity: 5, isDeleted: false, _count: { saleItems: 3 },
            }));

            const res = await request(app).delete('/api/batches/1');

            expect(res.status).toBe(400);
            expect(prisma.batch.update).not.toHaveBeenCalled();
            expect(prisma.batch.delete).not.toHaveBeenCalled();
        });

        it('retires (soft-deletes) a zero-quantity batch that has sales history', async () => {
            prisma.batch.findUnique.mockResolvedValue(asMock({
                id: 1, quantity: 0, isDeleted: false, _count: { saleItems: 2 },
            }));
            prisma.batch.update.mockResolvedValue(asMock({ id: 1, isDeleted: true }));

            const res = await request(app).delete('/api/batches/1');

            expect(res.status).toBe(200);
            expect(res.body.data.softDeleted).toBe(true);
            expect(prisma.batch.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true, deletedAt: expect.any(Date) },
            });
            expect(prisma.batch.delete).not.toHaveBeenCalled();
        });

        it('hard-deletes a zero-quantity batch with no sales history', async () => {
            prisma.batch.findUnique.mockResolvedValue(asMock({
                id: 1, quantity: 0, isDeleted: false, _count: { saleItems: 0 },
            }));
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));

            const res = await request(app).delete('/api/batches/1');

            expect(res.status).toBe(200);
            expect(res.body.data.softDeleted).toBe(false);
            expect(prisma.stockMovement.deleteMany).toHaveBeenCalledWith({ where: { batchId: 1 } });
            expect(prisma.batch.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(prisma.batch.update).not.toHaveBeenCalled();
        });

        it('treats an already-retired batch as not found', async () => {
            prisma.batch.findUnique.mockResolvedValue(asMock({
                id: 1, quantity: 0, isDeleted: true, _count: { saleItems: 2 },
            }));

            const res = await request(app).delete('/api/batches/1');

            expect(res.status).toBe(404);
        });
    });
});
