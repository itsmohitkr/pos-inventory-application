import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

describe('Vendor Domain API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /api/vendors (findOrCreate) ────────────────────────────────────────

  describe('POST /api/vendors (findOrCreate)', () => {
    it('creates a new vendor when the name is not registered', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);
      prisma.vendor.create.mockResolvedValue(asMock({
        id: 1,
        name: 'Fresh Wholesale',
        phone: '9876543210',
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post('/api/vendors')
        .send({ name: 'Fresh Wholesale', phone: '9876543210' });

      expect(res.status).toBe(201);
      expect(res.body.vendor.name).toBe('Fresh Wholesale');
      expect(res.body.isNew).toBe(true);
      expect(prisma.vendor.create).toHaveBeenCalled();
    });

    it('returns the existing vendor when the name already exists (case/whitespace-trimmed match)', async () => {
      const existing = {
        id: 1,
        name: 'Fresh Wholesale',
        phone: '9876543210',
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.vendor.findUnique.mockResolvedValue(asMock(existing));

      const res = await request(app)
        .post('/api/vendors')
        .send({ name: '  Fresh Wholesale  ' });

      expect(res.status).toBe(200);
      expect(res.body.vendor.id).toBe(1);
      expect(res.body.isNew).toBe(false);
      expect(prisma.vendor.create).not.toHaveBeenCalled();
      expect(prisma.vendor.findUnique).toHaveBeenCalledWith({ where: { name: 'Fresh Wholesale' } });
    });

    it('rejects a missing name', async () => {
      const res = await request(app).post('/api/vendors').send({ phone: '9876543210' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/vendors ─────────────────────────────────────────────────────────

  describe('GET /api/vendors', () => {
    it('returns a paginated vendor list with per-vendor totals', async () => {
      const mockVendors = [
        { id: 1, name: 'Fresh Wholesale', phone: null, address: null, createdAt: new Date(), updatedAt: new Date() },
      ];
      prisma.vendor.findMany.mockResolvedValue(asMock(mockVendors));
      prisma.vendor.count.mockResolvedValue(asMock(1));
      prisma.purchase.findMany.mockResolvedValue(asMock([
        { id: 1, totalAmount: 500, date: new Date(), payments: [{ amount: 200 }] },
      ]));

      const res = await request(app).get('/api/vendors');

      expect(res.status).toBe(200);
      expect(res.body.vendors).toHaveLength(1);
      expect(res.body.vendors[0].totalPurchased).toBe(500);
      expect(res.body.vendors[0].totalDue).toBe(300);
      expect(res.body.vendors[0].purchaseCount).toBe(1);
      expect(res.body.total).toBe(1);
    });

    it('filters by search query', async () => {
      prisma.vendor.findMany.mockResolvedValue(asMock([]));
      prisma.vendor.count.mockResolvedValue(asMock(0));

      const res = await request(app).get('/api/vendors?search=Fresh&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(prisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: { contains: 'Fresh' } }),
        })
      );
    });
  });

  // ── GET /api/vendors/:id ─────────────────────────────────────────────────────

  describe('GET /api/vendors/:id', () => {
    it('returns a vendor with its purchase history and totals', async () => {
      prisma.vendor.findUnique.mockResolvedValue(asMock({
        id: 1, name: 'Fresh Wholesale', phone: null, address: null, createdAt: new Date(), updatedAt: new Date(),
      }));
      prisma.purchase.findMany.mockResolvedValue(asMock([
        { id: 1, totalAmount: 500, date: new Date(), items: [], payments: [{ amount: 500 }] },
      ]));

      const res = await request(app).get('/api/vendors/1');

      expect(res.status).toBe(200);
      expect(res.body.vendor.id).toBe(1);
      expect(res.body.purchases).toHaveLength(1);
      expect(res.body.purchases[0].paymentStatus).toBe('Paid');
      expect(res.body.totalPurchased).toBe(500);
    });

    it('returns 404 for an unknown vendor', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/vendors/999');

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/vendors/:id ─────────────────────────────────────────────────────

  describe('PUT /api/vendors/:id', () => {
    it('updates vendor details', async () => {
      const existing = { id: 1, name: 'Fresh Wholesale', phone: null, address: null, createdAt: new Date(), updatedAt: new Date() };
      const updated = { ...existing, phone: '9999999999' };
      prisma.vendor.findUnique.mockResolvedValue(asMock(existing));
      prisma.vendor.update.mockResolvedValue(asMock(updated));

      const res = await request(app)
        .put('/api/vendors/1')
        .send({ phone: '9999999999' });

      expect(res.status).toBe(200);
      expect(res.body.phone).toBe('9999999999');
    });

    it('rejects a duplicate name on update', async () => {
      const vendor = { id: 1, name: 'Fresh Wholesale', phone: null, address: null, createdAt: new Date(), updatedAt: new Date() };
      const otherVendor = { id: 2, name: 'Other Vendor', phone: null, address: null, createdAt: new Date(), updatedAt: new Date() };

      prisma.vendor.findUnique
        .mockResolvedValueOnce(asMock(vendor))
        .mockResolvedValueOnce(asMock(otherVendor));

      const res = await request(app)
        .put('/api/vendors/1')
        .send({ name: 'Other Vendor' });

      expect(res.status).toBe(409);
    });

    it('returns 404 when updating an unknown vendor', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/vendors/999')
        .send({ phone: '9999999999' });

      expect(res.status).toBe(404);
    });
  });
});
