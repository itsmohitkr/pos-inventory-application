const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Loose-Sale Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/loose-sales', () => {
        it('should checkout loose-weight transactions properly', async () => {
            // Loose sales use similar transactions but calculate split weights
            prisma.looseSale.create.mockResolvedValue({
                id: 2,
                invoiceNumber: 'LS1002',
                totalAmount: 12.5,
            });

            const res = await request(app)
                .post('/api/loose-sales')
                .send({
                    itemName: 'Loose Apples',
                    price: 12.5
                });

            // Based on format: 'raw'
            expect(res.status).toBe(201);
            expect(res.body.invoiceNumber).toBe('LS1002');
            expect(res.body.id).toBe(2);
            expect(prisma.looseSale.create).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/loose-sales/:id', () => {
        it('should refund loose weight', async () => {
            prisma.looseSale.delete.mockResolvedValue({ id: 2 });

            const res = await request(app).delete('/api/loose-sales/2');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Loose sale deleted successfully');
            expect(prisma.looseSale.delete).toHaveBeenCalledWith({ where: { id: 2 } });
        });
    });
});
