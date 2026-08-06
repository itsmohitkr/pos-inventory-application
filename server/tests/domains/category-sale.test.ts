import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

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
  });
});
