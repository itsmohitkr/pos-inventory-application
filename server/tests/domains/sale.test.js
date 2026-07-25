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

    // Error paths. These lock in the exact HTTP statuses the sale flow returns —
    // all 400, matching the behaviour preserved when controller try/catch blocks
    // were replaced by service-thrown AppErrors.
    describe('POST /api/sale — error paths', () => {
        // Runs the real service logic inside a pass-through transaction so the
        // validation branches are actually exercised.
        const runRealTransaction = () => {
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.setting.findUnique.mockResolvedValue(null);
            prisma.promotion.findMany.mockResolvedValue([]);
        };

        const batch = (overrides = {}) => ({
            id: 1,
            productId: 1,
            quantity: 5,
            mrp: 100,
            costPrice: 40,
            sellingPrice: 60,
            wholesaleEnabled: false,
            wholesalePrice: null,
            wholesaleMinQty: null,
            batchCode: 'B-TEST',
            expiryDate: null,
            product: { id: 1, name: 'Test Product' },
            ...overrides,
        });

        it('rejects a sale when requested quantity exceeds batch stock', async () => {
            runRealTransaction();
            prisma.batch.findMany.mockResolvedValue([batch({ quantity: 2 })]);

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 5, sellingPrice: 60, isFree: false }],
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Insufficient stock');
            expect(res.body.message).toContain('Test Product');
            // Stock must not be touched when validation fails.
            expect(prisma.sale.create).not.toHaveBeenCalled();
        });

        it('rejects a sale containing an expired batch', async () => {
            runRealTransaction();
            const expired = new Date();
            expired.setFullYear(expired.getFullYear() - 1);
            prisma.batch.findMany.mockResolvedValue([batch({ expiryDate: expired })]);

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 1, sellingPrice: 60, isFree: false }],
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('expired on');
            expect(res.body.message).toContain('Test Product');
            expect(prisma.sale.create).not.toHaveBeenCalled();
        });

        it('rejects a sale referencing an unknown batch id', async () => {
            runRealTransaction();
            prisma.batch.findMany.mockResolvedValue([]);

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 999, quantity: 1, sellingPrice: 60, isFree: false }],
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Batch ID 999 not found');
            expect(prisma.sale.create).not.toHaveBeenCalled();
        });

        it('rejects a discount larger than the cart total', async () => {
            runRealTransaction();
            // 2 units @ 60 = 120 cart total.
            prisma.batch.findMany.mockResolvedValue([batch()]);

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 2, sellingPrice: 60, isFree: false }],
                    discount: 500,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('cannot exceed the cart total');
            // The critical assertion: no zero-value sale is recorded and no stock moves.
            expect(prisma.sale.create).not.toHaveBeenCalled();
        });

        it('rejects when discount and extraDiscount together exceed the cart total', async () => {
            runRealTransaction();
            prisma.batch.findMany.mockResolvedValue([batch()]);

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 2, sellingPrice: 60, isFree: false }],
                    discount: 100,
                    extraDiscount: 50, // 150 > 120
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('cannot exceed the cart total');
            expect(prisma.sale.create).not.toHaveBeenCalled();
        });

        it('allows a discount exactly equal to the cart total (100% off)', async () => {
            runRealTransaction();
            prisma.batch.findMany.mockResolvedValue([batch()]);
            prisma.sale.create.mockResolvedValue({
                id: 9, totalAmount: 0, discount: 120, extraDiscount: 0, items: [],
            });

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 2, sellingPrice: 60, isFree: false }],
                    discount: 120, // exactly the cart total
                });

            expect(res.status).toBe(201);
            expect(prisma.sale.create).toHaveBeenCalled();
        });

        it('applies roundOff from receipt settings to the stored total', async () => {
            // processSale reads posReceiptSettings.roundOff. This couples the
            // settings JSON path to money — pin it before that code is typed.
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.promotion.findMany.mockResolvedValue([]);
            prisma.setting.findUnique.mockResolvedValue({
                key: 'posReceiptSettings',
                value: JSON.stringify({ roundOff: true }),
            });
            prisma.batch.findMany.mockResolvedValue([batch({ sellingPrice: 60.4 })]);
            prisma.sale.create.mockResolvedValue({ id: 7, totalAmount: 60, items: [] });

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 1, sellingPrice: 60.4, isFree: false }],
                });

            expect(res.status).toBe(201);
            // 60.4 rounds to 60 because roundOff is enabled.
            expect(prisma.sale.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ totalAmount: 60 }),
                })
            );
        });

        it('preserves fractional totals when roundOff is disabled', async () => {
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.promotion.findMany.mockResolvedValue([]);
            prisma.setting.findUnique.mockResolvedValue({
                key: 'posReceiptSettings',
                value: JSON.stringify({ roundOff: false }),
            });
            prisma.batch.findMany.mockResolvedValue([batch({ sellingPrice: 60.4 })]);
            prisma.sale.create.mockResolvedValue({ id: 8, totalAmount: 60.4, items: [] });

            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 1, sellingPrice: 60.4, isFree: false }],
                });

            expect(res.status).toBe(201);
            expect(prisma.sale.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ totalAmount: 60.4 }),
                })
            );
        });

        it('rejects a fractional quantity at the validation layer', async () => {
            const res = await request(app)
                .post('/api/sale')
                .send({
                    items: [{ batch_id: 1, quantity: 2.5, sellingPrice: 60, isFree: false }],
                });

            // Batch.quantity is an Int column — this must be a clean 400, not a
            // 500 from Prisma rejecting the write.
            expect(res.status).toBe(400);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('rejects a sale with no items at the validation layer', async () => {
            const res = await request(app).post('/api/sale').send({ items: [] });

            expect(res.status).toBe(400);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/sale/:id/return — error paths', () => {
        it('rejects a return larger than the quantity originally sold', async () => {
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.sale.findUnique.mockResolvedValue({ id: 1, customerId: null });
            prisma.saleItem.findUnique.mockResolvedValue({
                id: 1,
                batchId: 1,
                quantity: 2,
                returnedQuantity: 0,
                sellingPrice: 100,
            });

            const res = await request(app)
                .post('/api/sale/1/return')
                .send({ items: [{ saleItemId: 1, quantity: 5 }] });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Cannot return more than sold quantity');
            // Stock must not be restored when the return is invalid.
            expect(prisma.batch.update).not.toHaveBeenCalled();
        });

        it('rejects a return against a sale that does not exist', async () => {
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.sale.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/sale/424242/return')
                .send({ items: [{ saleItemId: 1, quantity: 1 }] });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('not found');
            expect(prisma.batch.update).not.toHaveBeenCalled();
        });

        it('rejects a fractional return quantity at the validation layer', async () => {
            const res = await request(app)
                .post('/api/sale/1/return')
                .send({ items: [{ saleItemId: 1, quantity: 1.5 }] });

            expect(res.status).toBe(400);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('rejects a return referencing an unknown sale item', async () => {
            prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
            prisma.sale.findUnique.mockResolvedValue({ id: 1, customerId: null });
            prisma.saleItem.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/sale/1/return')
                .send({ items: [{ saleItemId: 999, quantity: 1 }] });

            // "Sale item N not found" matched the legacy notFoundMessages list → 404.
            expect(res.status).toBe(404);
            expect(res.body.message).toContain('Sale item 999 not found');
            expect(prisma.batch.update).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/sale/:id/return', () => {
        it('should refund/void sale, restore inventory, and update customer spend', async () => {
            const mockSale = {
                id: 1,
                customerId: 5,
                items: [
                    { 
                        id: 1, 
                        batchId: 1, 
                        quantity: 2, 
                        returnedQuantity: 0, 
                        sellingPrice: 100 
                    }
                ]
            };

            // Setup mocks for the service logic
            prisma.sale.findUnique.mockResolvedValue(mockSale);
            prisma.saleItem.findUnique.mockResolvedValue(mockSale.items[0]);
            prisma.batch.findUnique.mockResolvedValue({ id: 1, productId: 1 });
            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback(prisma);
            });

            const res = await request(app)
                .post('/api/sale/1/return')
                .send({
                    items: [{ saleItemId: 1, quantity: 1 }]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            
            // Verify customer spend was decremented
            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { totalSpend: { decrement: 100 } }
            });
            
            // Verify sale item return quantity was updated
            expect(prisma.saleItem.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { returnedQuantity: 1 }
            });
        });
    });

});
