const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Category Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/categories', () => {
        it('should fetch all categories formatted as tree', async () => {
            const mockCategories = [{ id: 1, name: 'Beverages' }];
            prisma.category.findMany.mockResolvedValue(mockCategories);

            const res = await request(app).get('/api/categories');

            expect(res.status).toBe(200);
            expect(prisma.category.findMany).toHaveBeenCalled();
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('POST /api/categories', () => {
        it('should create a new root category', async () => {
            prisma.category.findFirst.mockResolvedValue(null);
            prisma.category.create.mockResolvedValue({
                id: 3,
                name: 'Snacks',
                parentId: null
            });

            const res = await request(app)
                .post('/api/categories')
                .send({ name: 'Snacks' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Snacks');
        });

        it('should act idempotently for duplicate category names', async () => {
            prisma.category.findFirst.mockResolvedValue({ id: 1, name: 'Beverages' });

            const res = await request(app)
                .post('/api/categories')
                .send({ name: 'Beverages' });

            // Service returns existing category gracefully instead of 400
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(1);
        });
    });

    describe('PUT /api/categories/:id', () => {
        it('should rename a category successfully', async () => {
            // It queries all categories to map tree paths
            prisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Beverages' }]);
            prisma.product.findMany.mockResolvedValue([]); // For related products sync
            prisma.category.update.mockResolvedValue({ id: 1, name: 'Cold Beverages' });

            const res = await request(app)
                .put('/api/categories/1')
                .send({ name: 'Cold Beverages' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        it('should delete category successfully', async () => {
            // Must return full tree
            prisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Beverages' }]);
            prisma.$transaction.mockResolvedValue([1, 1]); // the 2-step transaction

            const res = await request(app).delete('/api/categories/1');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should recursively cascade delete category and its children', async () => {
            // Provide parent and child
            prisma.category.findMany.mockResolvedValue([
                { id: 1, name: 'Beverages', parentId: null },
                { id: 2, name: 'Soda', parentId: 1 }
            ]);
            prisma.$transaction.mockResolvedValue([1, 2]);

            const res = await request(app).delete('/api/categories/1');

            // The controller cascades! Should succeed
            expect(res.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
