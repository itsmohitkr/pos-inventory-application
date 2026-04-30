const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prisma');

describe('Customer Domain API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /api/customers ─────────────────────────────────────────────────────

  describe('POST /api/customers (findOrCreate)', () => {
    it('creates a new customer when phone is not registered', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({
        id: 1,
        phone: '9876543210',
        name: 'Ravi Kumar',
        customerBarcode: 'CUST-ABCD1234',
        totalSpend: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/customers')
        .send({ phone: '9876543210', name: 'Ravi Kumar' });

      expect(res.status).toBe(201);
      expect(res.body.customer.phone).toBe('9876543210');
      expect(res.body.isNew).toBe(true);
      expect(prisma.customer.create).toHaveBeenCalled();
    });

    it('returns existing customer when phone is already registered', async () => {
      const existing = {
        id: 1,
        phone: '9876543210',
        name: 'Ravi Kumar',
        customerBarcode: 'CUST-ABCD1234',
        totalSpend: 500,
        lastVisit: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.customer.findUnique.mockResolvedValue(existing);

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
        customerBarcode: 'CUST-ZZZ00001',
        totalSpend: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, name: 'New Name' };
      prisma.customer.findUnique.mockResolvedValue(existing);
      prisma.customer.update.mockResolvedValue(updated);

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
        { id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-AAAAAAAA', totalSpend: 100, lastVisit: null, createdAt: new Date(), updatedAt: new Date(), _count: { sales: 2 }, sales: [] },
        { id: 2, phone: '9876543211', name: 'Priya', customerBarcode: 'CUST-BBBBBBBB', totalSpend: 200, lastVisit: null, createdAt: new Date(), updatedAt: new Date(), _count: { sales: 5 }, sales: [] },
      ];
      prisma.customer.findMany.mockResolvedValue(mockCustomers);
      prisma.customer.count.mockResolvedValue(2);

      const res = await request(app).get('/api/customers');

      expect(res.status).toBe(200);
      expect(res.body.customers).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('filters by search query', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

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
      prisma.customer.findUnique.mockResolvedValue({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-AAAAAAAA',
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      });

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
      const existing = { id: 1, phone: '9876543210', name: 'Old Name', customerBarcode: 'CUST-AAAAAAAA', totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };
      const updated = { ...existing, name: 'New Name' };
      prisma.customer.findUnique.mockResolvedValue(existing);
      prisma.customer.update.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/customers/1')
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('rejects duplicate phone on update', async () => {
      const customer = { id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-AAAAAAAA', totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };
      const otherCustomer = { id: 2, phone: '9999999999', name: 'Other', customerBarcode: 'CUST-ZZZZZZZZ', totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date() };

      prisma.customer.findUnique
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(otherCustomer);

      const res = await request(app)
        .put('/api/customers/1')
        .send({ phone: '9999999999' });

      expect(res.status).toBe(409);
    });
  });

  // ── GET /api/customers/barcode/:barcode ─────────────────────────────────────

  describe('GET /api/customers/barcode/:barcode', () => {
    it('returns customer by barcode', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-ABCD1234',
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app).get('/api/customers/barcode/CUST-ABCD1234');

      expect(res.status).toBe(200);
      expect(res.body.customerBarcode).toBe('CUST-ABCD1234');
    });

    it('returns 404 for unknown barcode', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/customers/barcode/CUST-ZZZZZZZZ');

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
      prisma.customer.findUnique.mockResolvedValue({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-ABCD1234',
        totalSpend: 0, lastVisit: null, createdAt: new Date(), updatedAt: new Date(),
      });

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
      prisma.customer.findUnique.mockResolvedValue({
        id: 1, phone: '9876543210', name: 'Ravi', customerBarcode: 'CUST-ABCD1234',
        totalSpend: 500, lastVisit: new Date(), createdAt: new Date(), updatedAt: new Date(),
      });
      prisma.sale.findMany.mockResolvedValue([
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
      ]);

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
