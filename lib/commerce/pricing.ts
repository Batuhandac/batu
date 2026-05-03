import { CardPrice, Currency, UserCard } from '@/types';

export interface PricingRule {
  targetCurrency: Currency;
  fxRate: number;
  markupPercent: number;
  platformFeePercent: number;
  paymentFeePercent: number;
  fixedFee: number;
  minimumPrice: number;
  rounding: 'none' | 'nearest_1' | 'nearest_5' | 'nearest_10' | 'ending_90' | 'ending_99';
}

export const DEFAULT_TRY_PRICING_RULE: PricingRule = {
  targetCurrency: 'TRY',
  fxRate: 38,
  markupPercent: 20,
  platformFeePercent: 10,
  paymentFeePercent: 3,
  fixedFee: 0,
  minimumPrice: 25,
  rounding: 'ending_90',
};

export function priceForSale(
  userCard: UserCard,
  rule: PricingRule = DEFAULT_TRY_PRICING_RULE,
): { amount: number; currency: Currency; sourcePrice?: CardPrice } {
  const sourcePrice = userCard.price;
  const market = sourcePrice?.market ?? sourcePrice?.mid ?? userCard.purchasePrice ?? 0;
  const base = sourcePrice?.currency === rule.targetCurrency ? market : market * rule.fxRate;
  const uplift = base * (1 + rule.markupPercent / 100);
  const feeAdjusted = uplift * (1 + (rule.platformFeePercent + rule.paymentFeePercent) / 100) + rule.fixedFee;
  const amount = roundPrice(Math.max(rule.minimumPrice, feeAdjusted), rule.rounding);

  return { amount, currency: rule.targetCurrency, sourcePrice };
}

export function roundPrice(value: number, rounding: PricingRule['rounding']): number {
  switch (rounding) {
    case 'nearest_1':
      return Math.round(value);
    case 'nearest_5':
      return Math.ceil(value / 5) * 5;
    case 'nearest_10':
      return Math.ceil(value / 10) * 10;
    case 'ending_90':
      return Math.max(0, Math.ceil(value / 10) * 10 - 0.1);
    case 'ending_99':
      return Math.max(0, Math.ceil(value) - 0.01);
    default:
      return Number(value.toFixed(2));
  }
}
