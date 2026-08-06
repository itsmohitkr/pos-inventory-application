import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';
import { computeComputedStatus } from '../../src/domains/category-sale/category-sale.service';

const prisma = getMockPrisma();

describe('Category Sale Domain API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.categorySale as any).findMany.mockResolvedValue(asMock([]));
  });

  describe('Status Computation Logic', () => {
    it('should calculate computed status correctly', () => {
      const now = new Date('2026-08-01T12:00:00Z');

      expect(
        computeComputedStatus({ status: 'draft', isIndefinite: false, startDate: null, endDate: null }, now)
      ).toBe('draft');

      expect(
        computeComputedStatus({ status: 'paused', isIndefinite: false, startDate: null, endDate: null }, now)
      ).toBe('paused');

      expect(
        computeComputedStatus({ status: 'active', isIndefinite: true, startDate: null, endDate: null }, now)
      ).toBe('active');

      expect(
        computeComputedStatus(
          {
            status: 'active',
            isIndefinite: false,
            startDate: new Date('2026-08-05T00:00:00Z'),
            endDate: new Date('2026-08-10T00:00:00Z'),
          },
          now
        )
      ).toBe('scheduled');

      expect(
        computeComputedStatus(
          {
            status: 'active',
            isIndefinite: false,
            startDate: new Date('2026-07-01T00:00:00Z'),
            endDate: new Date('2026-07-20T00:00:00Z'),
          },
          now
        )
      ).toBe('expired');

      expect(
        computeComputedStatus(
          {
            status: 'active',
            isIndefinite: false,
            startDate: new Date('2026-07-01T00:00:00Z'),
            endDate: new Date('2026-08-20T00:00:00Z'),
          },
          now
        )
      ).toBe('active');
    });
  });

  describe('POST /api/category-sales', () => {
    it('should create a category sale successfully', async () => {
      (prisma as any).categorySale.create.mockResolvedValue(
        asMock({
          id: 1,
          name: 'Baby Products Discount',
          category: 'Baby Care',
          discountPercentage: 10,
          isIndefinite: true,
          startDate: null,
          endDate: null,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await request(app)
        .post('/api/category-sales')
        .send({
          name: 'Baby Products Discount',
          category: 'Baby Care',
          discountPercentage: 10,
          isIndefinite: true,
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(res.body.computedStatus).toBe('active');
    });

    it('should store excludedProductIds when provided', async () => {
      (prisma as any).categorySale.create.mockResolvedValue(
        asMock({
          id: 2,
          name: 'Selective Category Discount',
          category: 'Baby Care',
          discountPercentage: 15,
          isIndefinite: true,
          startDate: null,
          endDate: null,
          status: 'active',
          excludedProductIds: '[102, 105]',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await request(app)
        .post('/api/category-sales')
        .send({
          name: 'Selective Category Discount',
          category: 'Baby Care',
          discountPercentage: 15,
          isIndefinite: true,
          status: 'active',
          excludedProductIds: [102, 105],
        });

      expect(res.status).toBe(201);
      expect(res.body.excludedProductIds).toEqual([102, 105]);
    });
  });

  describe('GET /api/category-sales', () => {
    it('should fetch all category sales with computed status', async () => {
      (prisma as any).categorySale.findMany.mockResolvedValue(
        asMock([
          {
            id: 1,
            name: 'Summer Sale',
            category: 'Beverages',
            discountPercentage: 15,
            isIndefinite: true,
            startDate: null,
            endDate: null,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      );

      const res = await request(app).get('/api/category-sales');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].computedStatus).toBe('active');
    });
  });

  describe('GET /api/category-sales/preview', () => {
    it('should generate product preview with cost, selling price, and margins', async () => {
      prisma.product.findMany.mockResolvedValue(
        asMock([
          {
            id: 101,
            name: 'Baby Lotion',
            barcode: '123456',
            category: 'Baby Care',
            batches: [
              {
                mrp: 120,
                costPrice: 80,
                sellingPrice: 100,
                createdAt: new Date(),
              },
            ],
          },
        ])
      );

      const res = await request(app)
        .get('/api/category-sales/preview')
        .query({ category: 'Baby Care', discountPercentage: 10 });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Baby Lotion');
      expect(res.body[0].mrp).toBe(120);
      expect(res.body[0].costPrice).toBe(80);
      expect(res.body[0].vendorDiscountAmount).toBe(40); // 120 - 80
      expect(res.body[0].vendorDiscountPercentage).toBe(33.3); // (40/120)*100
      expect(res.body[0].currentSellingPrice).toBe(100);
      expect(res.body[0].regularProfitAmount).toBe(20); // 100 - 80
      expect(res.body[0].regularProfitMargin).toBe(20); // (20/100)*100
      // 120 * 0.90 = 108, which is WORSE than the current regular price of
      // 100 (this product is already discounted more off MRP than this 10%
      // category sale offers) — so the effective price stays at the current
      // 100, not the naive MRP-based 108, matching what processSale's own
      // bestDiscountPrice < sellingPrice guard would actually charge.
      expect(res.body[0].newSellingPrice).toBe(100);
      expect(res.body[0].noAdditionalDiscount).toBe(true);
      expect(res.body[0].marginProtected).toBe(false);
      expect(res.body[0].profitAmount).toBe(20); // 100 - 80, unchanged from regular
      expect(res.body[0].profitMargin).toBe(20); // unchanged from regular
    });
  });
});
