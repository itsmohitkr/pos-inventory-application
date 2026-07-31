/**
 * Types for the promotions domain.
 *
 * Two distinct features live here:
 *  - Scheduled sales: a named Promotion with a date window and per-product
 *    promo prices, stored in the Promotion/PromotionItem tables.
 *  - Buy-X-get-free thresholds: a settings blob stored under the
 *    `promotion_buy_x_get_free` key, not a table.
 */

/** One product's promo price inside a scheduled sale. */
export interface PromotionItem {
  productId: number;
  /**
   * Included by GET /api/promotions (getAllPromotions selects id/name/barcode)
   * but absent from the form's locally-built items, hence optional.
   */
  product?: { id: number; name: string; barcode?: string | null };
  productName?: string;
  promoPrice: number;
  discountPercentage?: number | null;
  mrp?: number;
  costPrice?: number;
  sellingPrice?: number;
}

/** A scheduled sale as returned by GET /api/promotions. */
export interface Promotion {
  id: number;
  name: string;
  /** ISO strings over the wire. */
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: PromotionItem[];
}

/** The create/edit form's state. Dates are YYYY-MM-DD local. */
export interface PromotionFormState {
  name: string;
  startDate: string;
  endDate: string;
  items: PromotionItem[];
  isActive?: boolean;
}

/** Current pricing for the product selected in the form. */
export interface ProductPriceInfo {
  mrp: number;
  costPrice: number;
  sellingPrice: number;
}

/**
 * One buy-X-get-free tier.
 *
 * `threshold` is the cart total that unlocks the tier and doubles as the
 * identity of the row — add/remove/update all match on it.
 */
export interface PromoThresholdConfig {
  threshold: number;
  isActive: boolean;
  profitPercentage: number;
  minCostPrice: number;
  maxCostPrice: number | null;
  allowedGroups?: string[];
  disallowedGroups?: string[];
  sortBySales: string;
  maxGiftsToShow: number;
}

export interface PromoSettings {
  enabled: boolean;
  config: PromoThresholdConfig[];
  /** Legacy shape kept for the migration path in fetchPromoSettings. */
  thresholds?: number[];
  profitPercentage?: number;
  minCostPrice?: number;
  maxCostPrice?: number | null;
  sortBySales?: string;
  maxGiftsToShow?: number;
}

export type CategorySaleComputedStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';

export interface CategorySale {
  id: number;
  name: string;
  category: string;
  discountPercentage: number;
  isIndefinite: boolean;
  startDate: string | null;
  endDate: string | null;
  status: 'draft' | 'active' | 'paused';
  excludedProductIds?: number[];
  computedStatus: CategorySaleComputedStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySaleInput {
  name: string;
  category: string;
  discountPercentage: number;
  isIndefinite: boolean;
  startDate?: string | null;
  endDate?: string | null;
  status?: 'draft' | 'active' | 'paused';
  excludedProductIds?: number[];
}

export interface CategorySaleProductPreview {
  id: number;
  name: string;
  barcode: string | null;
  mrp: number;
  costPrice: number;
  vendorDiscountAmount: number;
  vendorDiscountPercentage: number;
  currentSellingPrice: number;
  currentCustomerDiscountAmount: number;
  currentCustomerDiscountPercentage: number;
  regularProfitAmount: number;
  regularProfitMargin: number;
  discountPercentage: number;
  newSellingPrice: number;
  profitAmount: number;
  profitMargin: number;
}
