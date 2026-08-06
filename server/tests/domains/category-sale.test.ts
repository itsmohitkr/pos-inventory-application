import request from 'supertest';
import app = require('../../src/app');
import * as adminTokens from '../../src/domains/auth/adminTokens';
import { previewCategorySaleProducts } from '../../src/domains/category-sale/category-sale.service';
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

/** Same pattern as auth.test.ts — mint a real token directly rather than logging in. */
const withAdminToken = async () => {
  const { token } = await adminTokens.issueToken({ id: 1, username: 'admin', role: 'admin' });
  return token;
};

/** A product with one batch, shaped the way previewCategorySaleProducts reads it. */
const productWithBatch = (overrides: {
  id: number;
  name: string;
  category: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
}) => ({
  id: overrides.id,
  name: overrides.name,
  barcode: null,
  category: overrides.category,
  isDeleted: false,
  batches: [
    {
      id: overrides.id * 10,
      productId: overrides.id,
      mrp: overrides.mrp,
      costPrice: overrides.costPrice,
      sellingPrice: overrides.sellingPrice,
      createdAt: new Date(),
    },
  ],
});

describe('Category-sale domain — preview pricing protections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminTokens.__clearAllTokens();
  });

  describe('GET /api/category-sales/preview', () => {
    it('flags noAdditionalDiscount when the regular price already beats the category discount', async () => {
      // cost 60, mrp 100, regular sellingPrice 85 (already 15% off mrp).
      // A 10% category discount off mrp = 90, which is worse than 85, so no
      // extra discount should actually apply.
      prisma.product.findMany.mockResolvedValue(
        asMock([
          productWithBatch({
            id: 1,
            name: 'Already Discounted Product',
            category: 'Snacks',
            mrp: 100,
            costPrice: 60,
            sellingPrice: 85,
          }),
        ])
      );

      const res = await request(app)
        .get('/api/category-sales/preview')
        .query({ category: 'Snacks', discountPercentage: 10 });

      expect(res.status).toBe(200);
      const item = res.body[0];
      expect(item.noAdditionalDiscount).toBe(true);
      expect(item.marginProtected).toBe(false);
      expect(item.newSellingPrice).toBe(85);
      expect(item.profitAmount).toBe(25);
    });

    it('flags marginProtected and caps at cost when the discount would undercut a low-margin product', async () => {
      // cost 93, mrp 100, regular sellingPrice 100 (7% margin, no everyday
      // discount). A 10% category discount off mrp = 90, which is below the
      // 93 cost — must be capped at cost (breakeven), not sold at a loss.
      prisma.product.findMany.mockResolvedValue(
        asMock([
          productWithBatch({
            id: 2,
            name: 'Low Margin Product',
            category: 'Snacks',
            mrp: 100,
            costPrice: 93,
            sellingPrice: 100,
          }),
        ])
      );

      const res = await request(app)
        .get('/api/category-sales/preview')
        .query({ category: 'Snacks', discountPercentage: 10 });

      expect(res.status).toBe(200);
      const item = res.body[0];
      expect(item.marginProtected).toBe(true);
      expect(item.noAdditionalDiscount).toBe(false);
      expect(item.newSellingPrice).toBe(93);
      expect(item.profitAmount).toBe(0);
      expect(item.profitMargin).toBe(0);
    });

    it('applies the discount normally when neither protection is needed', async () => {
      // cost 40, mrp 100, regular sellingPrice 100 (no everyday discount,
      // healthy margin). A 20% category discount off mrp = 80, well above
      // cost and genuinely better than the regular price.
      prisma.product.findMany.mockResolvedValue(
        asMock([
          productWithBatch({
            id: 3,
            name: 'Healthy Margin Product',
            category: 'Snacks',
            mrp: 100,
            costPrice: 40,
            sellingPrice: 100,
          }),
        ])
      );

      const res = await request(app)
        .get('/api/category-sales/preview')
        .query({ category: 'Snacks', discountPercentage: 20 });

      expect(res.status).toBe(200);
      const item = res.body[0];
      expect(item.marginProtected).toBe(false);
      expect(item.noAdditionalDiscount).toBe(false);
      expect(item.newSellingPrice).toBe(80);
      expect(item.profitAmount).toBe(40);
      expect(item.profitMargin).toBe(50);
    });

    it('flags hasPricingData false for a product with no batch, instead of misreporting it as already-better-priced', async () => {
      // No batches at all — mrp/costPrice/currentSellingPrice would all
      // naively be 0, and 0 >= 0 used to make noAdditionalDiscount true,
      // mislabeling "no data yet" as "already has a better regular price".
      prisma.product.findMany.mockResolvedValue(
        asMock([
          {
            id: 5,
            name: 'Never Stocked Product',
            barcode: null,
            category: 'Snacks',
            isDeleted: false,
            batches: [],
          },
        ])
      );

      const res = await request(app)
        .get('/api/category-sales/preview')
        .query({ category: 'Snacks', discountPercentage: 10 });

      expect(res.status).toBe(200);
      const item = res.body[0];
      expect(item.hasPricingData).toBe(false);
      expect(item.noAdditionalDiscount).toBe(false);
      expect(item.marginProtected).toBe(false);
      expect(item.newSellingPrice).toBe(0);
    });
  });

  describe('previewCategorySaleProducts — admin overrides (service-level, no HTTP query shape for a draft override)', () => {
    it('uses the override discount, bypassing the margin floor, when one is provided', async () => {
      // cost 93, mrp 100 — same low-margin product as the margin-protected
      // case above, but this time the admin has deliberately overridden it
      // to 15% off, which undercuts cost (85 < 93). Unlike the automatic
      // path, an override is a conscious choice and is NOT floored.
      prisma.product.findMany.mockResolvedValue(
        asMock([
          productWithBatch({
            id: 4,
            name: 'Festival Clearance Product',
            category: 'Snacks',
            mrp: 100,
            costPrice: 93,
            sellingPrice: 100,
          }),
        ])
      );

      const items = await previewCategorySaleProducts('Snacks', 10, [
        { productId: 4, discountPercentage: 15, reason: 'Festival clearance' },
      ]);

      expect(items[0].isOverride).toBe(true);
      expect(items[0].overrideReason).toBe('Festival clearance');
      expect(items[0].newSellingPrice).toBe(85);
      expect(items[0].marginProtected).toBe(false);
      expect(items[0].noAdditionalDiscount).toBe(false);
      // Deliberately below cost — the whole point of an override.
      expect(items[0].profitAmount).toBe(-8);
    });
  });

  describe('Admin gating for productOverrides on create/update', () => {
    const validSaleBody = {
      name: 'Festival Sale',
      category: 'Snacks',
      discountPercentage: 10,
      isIndefinite: true,
      status: 'active',
      productOverrides: [{ productId: 4, discountPercentage: 15, reason: 'Festival clearance' }],
    };

    it('rejects POST /api/category-sales with productOverrides and no admin token', async () => {
      const res = await request(app).post('/api/category-sales').send(validSaleBody);
      expect(res.status).toBe(401);
    });

    it('accepts POST /api/category-sales with productOverrides and a valid admin token', async () => {
      prisma.categorySale.create.mockResolvedValue(
        asMock({
          id: 10,
          ...validSaleBody,
          startDate: null,
          endDate: null,
          excludedProductIds: null,
          productOverrides: JSON.stringify(validSaleBody.productOverrides),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await request(app)
        .post('/api/category-sales')
        .set('X-Admin-Token', await withAdminToken())
        .send(validSaleBody);

      expect(res.status).toBe(201);
      expect(res.body.productOverrides).toEqual(validSaleBody.productOverrides);
    });

    it('does not require an admin token when productOverrides is absent', async () => {
      prisma.categorySale.create.mockResolvedValue(
        asMock({
          id: 11,
          name: 'Plain Sale',
          category: 'Snacks',
          discountPercentage: 10,
          isIndefinite: true,
          status: 'active',
          startDate: null,
          endDate: null,
          excludedProductIds: null,
          productOverrides: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await request(app).post('/api/category-sales').send({
        name: 'Plain Sale',
        category: 'Snacks',
        discountPercentage: 10,
        isIndefinite: true,
        status: 'active',
      });

      expect(res.status).toBe(201);
    });

    it('rejects PUT /api/category-sales/:id with productOverrides and no admin token', async () => {
      prisma.categorySale.findUnique.mockResolvedValue(asMock({ id: 12 }));
      const res = await request(app).put('/api/category-sales/12').send(validSaleBody);
      expect(res.status).toBe(401);
    });
  });
});
