import type { PromoThresholdConfig } from '@/domains/promotions/types';

/**
 * The cost-price band a free-gift batch must fall in for a given threshold
 * tier. `maxCostPrice` is an optional additional ceiling a shop owner can set
 * (ThresholdSettingsPanel's "MAX ITEM CP", placeholder "Auto (Profit)") — it
 * narrows the range, it never widens it past the profit-based limit, since
 * that limit is the one guarantee shown to the shop owner ("The cost of the
 * gift cannot exceed this % of the order profit").
 */
export const resolveFreeGiftCostRange = (
  config: PromoThresholdConfig,
  totalProfit: number
): { minCost: number; maxCost: number } => {
  const profitLimit = Number(totalProfit) * (Number(config.profitPercentage || 20) / 100);
  const minCost = Number(config.minCostPrice || 0);
  const maxCost =
    config.maxCostPrice !== null && config.maxCostPrice !== undefined
      ? Math.min(Number(config.maxCostPrice), profitLimit)
      : profitLimit;
  return { minCost, maxCost };
};
