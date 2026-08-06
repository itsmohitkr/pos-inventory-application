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

/**
 * A deliberate, admin-approved per-product discount that bypasses the
 * automatic margin floor — e.g. a festival clearance sold below cost. The
 * reason is required precisely because that's a conscious choice; see
 * category-sale.router.ts's requireAdminForOverrides.
 */
export interface CategorySaleProductOverride {
  productId: number;
  discountPercentage: number;
  reason: string;
}

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
  productOverrides?: CategorySaleProductOverride[];
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
  productOverrides?: CategorySaleProductOverride[];
  /** Only read server-side when productOverrides is non-empty — see requireAdminForOverrides. */
  adminToken?: string | null;
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
  /** The naive MRP-based discount would have undercut cost; price was capped at breakeven instead. */
  marginProtected: boolean;
  /** The product's current regular price already beats what this category discount offers — no extra discount applies. */
  noAdditionalDiscount: boolean;
  /** An admin has deliberately overridden this product's discount, bypassing the automatic margin floor. */
  isOverride: boolean;
  overrideReason: string | null;
  /** No batch has ever been added for this product — mrp/costPrice/currentSellingPrice are all 0 because there's genuinely no data, not because of any pricing outcome. */
  hasPricingData: boolean;
}
