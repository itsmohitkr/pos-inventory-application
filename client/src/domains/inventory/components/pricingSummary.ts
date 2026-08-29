/**
 * Discount/Margin/Vendor-Discount figures shown in the small summary cards
 * on both the Add Product form (ProductInitialBatchSection.tsx, via
 * useAddProductForm.ts) and the New/Edit Batch forms (BatchFormFields.tsx).
 * Previously computed independently in both places with a subtly different
 * formula (one gated on mrp>0 && sellingPrice>0, the other didn't) — this is
 * the single shared version, using the more defensive gated behavior (no
 * discount/margin shown until both prices are actually entered).
 */
export interface PricingSummary {
  discountValue: number;
  discountPercent: number;
  marginValue: number;
  marginPercent: number;
  vendorDiscountValue: number;
  vendorDiscountPercent: number;
}

export const computePricingSummary = (mrp: number, costPrice: number, sellingPrice: number): PricingSummary => {
  const discountValue = mrp > 0 && sellingPrice > 0 ? Math.max(0, mrp - sellingPrice) : 0;
  const discountPercent = mrp > 0 ? Math.max(0, ((mrp - sellingPrice) / mrp) * 100) : 0;

  const marginValue = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;

  const vendorDiscountValue = mrp > 0 && costPrice > 0 ? Math.max(0, mrp - costPrice) : 0;
  const vendorDiscountPercent = mrp > 0 ? Math.max(0, ((mrp - costPrice) / mrp) * 100) : 0;

  return { discountValue, discountPercent, marginValue, marginPercent, vendorDiscountValue, vendorDiscountPercent };
};
