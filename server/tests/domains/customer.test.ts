import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';
import { buildCustomerBarcode } from '../../src/domains/customer/customerBarcode';

const prisma = getMockPrisma();

// Fixture barcodes, derived the same way the service derives them (from a
// customer's own id) rather than hand-typed, so a valid-format barcode is
// guaranteed even if the check-digit algorithm ever changes.
const BARCODE_1 = buildCustomerBarcode(1);
const BARCODE_2 = buildCustomerBarcode(2);
const BARCODE_UNKNOWN = buildCustomerBarcode(999999);

describe('Customer Domain API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /api/customers ─────────────────────────────────────────────────────

  describe('POST /api/customers (findOrCreate)', () => {
    it('creates a new customer when phone is not registered', async () => {
      // The barcode is derived from the row's own id, so the service creates
      // the row first (inside a transaction), then updates it with the real
      // barcode — matches the pass-through transaction mock pattern used by
      // sale.test.ts (runs the real service logic against the same mocked
      // client rather than a separate `tx`).
      prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(asMock({
        id: 1,
        phone: '9876543210',
        name: 'Ravi Kumar',
        customerBarcode: 'pending-placeholder',
        totalSpend: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      prisma.customer.update.mockResolvedValue(asMock({
        id: 1,
        phone: '9876543210',
        name: 'Ravi Kumar',
        customerBarcode: BARCODE_1,
        totalSpend: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post('/api/customers')
        .send({ phone: '9876543210', name: 'Ravi Kumar' });

      expect(res.status).toBe(201);
      expect(res.body.customer.phone).toBe('9876543210');
      expect(res.body.customer.customerBarcode).toBe(BARCODE_1);
      expect(res.body.isNew).toBe(true);
      expect(prisma.customer.create).toHaveBeenCalled();
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { customerBarcode: BARCODE_1 } })
      );
    });

    it('returns existing customer when phone is already registered', async () => {
      const existing = {
        id: 1,
        phone: '9876543210',
        name: 'Ravi Kumar',
        customerBarcode: BARCODE_1,
        totalSpend: 500,
        lastVisit: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.customer.findUnique.mockResolvedValue(asMock(existing));

      const res = await request(app)
        .post('/api/customers')
        .send({ phone: '9876543210' });

      expect(res.status).toBe(200);
      expect(res.body.customer.id).toBe(1);
      expect(res.body.isNew).toBe(false);
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it('updates name on existing customer if they previously had none', async () => {
      const existing = {
        id: 2,
        phone: '9000000001',
        name: null,
        customerBarcode: BARCODE_2,
        totalSpend: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, name: 'New Name' };
      prisma.customer.findUnique.mockResolvedValue(asMock(existing));
      prisma.customer.update.mockResolvedValue(asMock(updated));

      const res = await request(app)
        .post('/api/customers')
        .send({ phone: '9000000001', name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.customer.name).toBe('New Name');
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 2 }, data: { name: 'New Name' } })
      );
    });

    it('rejects missing phone', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ name: 'No Phone' });

      expect(res.status).toBe(400);
    });

    it('rejects phone shorter than 7 digits', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/customers ──────────────────────────────────────────────────────

  describe('GET /api/customers', () => {
    it('returns paginated customer list', async () => {
      const mockCustomers = [
        { id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1, totalSpend: 100, lastVisit: null, createdAt: new Date(), updatedAt: new Date(), _count: { sales: 2 }, sales: [] },
        { id: 2, phone: '9876543211', name: 'Priya', customerBarcode: BARCODE_2, totalSpend: 200, lastVisit: null, createdAt: new Date(), updatedAt: new Date(), _count: { sales: 5 }, sales: [] },
      ];
      prisma.customer.findMany.mockResolvedValue(asMock(mockCustomers));
      prisma.customer.count.mockResolvedValue(asMock(2));

      const res = await request(app).get('/api/customers');

      expect(res.status).toBe(200);
      expect(res.body.customers).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('filters by search query', async () => {
      prisma.customer.findMany.mockResolvedValue(asMock([]));
      prisma.customer.count.mockResolvedValue(asMock(0));

      const res = await request(app).get('/api/customers?search=Ravi&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      );
    });
  });

  // ── GET /api/customers/:id ──────────────────────────────────────────────────

  describe('GET /api/customers/:id', () => {
    it('returns customer by id', async () => {
      prisma.customer.findUnique.mockResolvedValue(asMock({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1,
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      }));

      const res = await request(app).get('/api/customers/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('returns 404 for unknown customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/customers/999');

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/customers/:id ──────────────────────────────────────────────────

  describe('PUT /api/customers/:id', () => {
    it('updates customer name', async () => {
      const existing = { id: 1, phone: '9876543210', name: 'Old Name', customerBarcode: BARCODE_1, totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };
      const updated = { ...existing, name: 'New Name' };
      prisma.customer.findUnique.mockResolvedValue(asMock(existing));
      prisma.customer.update.mockResolvedValue(asMock(updated));

      const res = await request(app)
        .put('/api/customers/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('rejects duplicate phone on update', async () => {
      const customer = { id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1, totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };
      const otherCustomer = { id: 2, phone: '9999999999', name: 'Other', customerBarcode: BARCODE_2, totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };

      prisma.customer.findUnique
        .mockResolvedValueOnce(asMock(customer))
        .mockResolvedValueOnce(asMock(otherCustomer));

      const res = await request(app)
        .put('/api/customers/1')
        .send({ phone: '9999999999' });

      expect(res.status).toBe(409);
    });
  });

  // ── GET /api/customers/barcode/:barcode ─────────────────────────────────────

  describe('GET /api/customers/barcode/:barcode', () => {
    it('returns customer by barcode', async () => {
      prisma.customer.findUnique.mockResolvedValue(asMock({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1,
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      }));

      const res = await request(app).get(`/api/customers/barcode/${BARCODE_1}`);

      expect(res.status).toBe(200);
      expect(res.body.customerBarcode).toBe(BARCODE_1);
    });

    it('returns 404 for unknown barcode', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const res = await request(app).get(`/api/customers/barcode/${BARCODE_UNKNOWN}`);

      expect(res.status).toBe(404);
    });

    it('rejects malformed barcode format', async () => {
      const res = await request(app).get('/api/customers/barcode/INVALID');

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/customers/phone/:phone ─────────────────────────────────────────

  describe('GET /api/customers/phone/:phone', () => {
    it('returns customer by phone', async () => {
      prisma.customer.findUnique.mockResolvedValue(asMock({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1,
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      }));

      const res = await request(app).get('/api/customers/phone/9876543210');

      expect(res.status).toBe(200);
      expect(res.body.phone).toBe('9876543210');
    });

    it('returns 404 for unregistered phone', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/customers/phone/9000000000');

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/customers/:id/history ──────────────────────────────────────────

  describe('GET /api/customers/:id/history', () => {
    it('returns purchase history for a known customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(asMock({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: BARCODE_1,
        totalSpend: 500, lastVisit: new Date(), createdAt: new Date(), updatedAt: new Date(),
      }));
      prisma.sale.findMany.mockResolvedValue(asMock([
        {
          id: 10,
          totalAmount: 250,
          discount: 0,
          extraDiscount: 0,
          paymentMethod: 'Cash',
          customerId: 1,
          createdAt: new Date(),
          items: [],
        },
      ]));

      const res = await request(app).get('/api/customers/1/history');

      expect(res.status).toBe(200);
      expect(res.body.customer.id).toBe(1);
      expect(res.body.sales).toHaveLength(1);
    });

    it('returns 404 when customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/customers/999/history');

      expect(res.status).toBe(404);
    });
  });
});
