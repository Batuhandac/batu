import { UserCard } from '@/types';
import { DEFAULT_TRY_PRICING_RULE, PricingRule, priceForSale } from './pricing';

export interface RepricingSuggestion {
  userCardId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  deltaPercent: number;
  currency: string;
}

export interface GradingRoiInput {
  rawMarketUsd: number;
  gradedMarketUsd: number;
  gradingCostUsd: number;
  shippingCostUsd: number;
  platformFeePercent?: number;
}

export interface FraudSignalInput {
  scanVerified: boolean;
  visualConfidence?: number;
  marketUsd?: number;
  condition?: string;
  hasReferenceImage?: boolean;
}

export function buildOpsSnapshot(cards: UserCard[], rule: PricingRule = DEFAULT_TRY_PRICING_RULE) {
  const totalQuantity = cards.reduce((sum, item) => sum + item.quantity, 0);
  const duplicateUnits = cards.reduce((sum, item) => sum + Math.max(0, item.quantity - 1), 0);
  const pricedCards = cards.filter((item) => item.price?.market || item.price?.mid);
  const highValueCards = cards.filter((item) => (item.price?.market ?? item.price?.mid ?? 0) >= 40);
  const repricing = buildRepricingSuggestions(cards, rule);

  return {
    totalQuantity,
    duplicateUnits,
    pricedCount: pricedCards.length,
    highValueCount: highValueCards.length,
    repricing,
    bulkScan: {
      targetBatchSize: 30,
      reviewGate: 'exact_print_required',
      autoAddRule: 'verified_only',
    },
    channels: ['shopify', 'ikas', 'ebay', 'trendyol', 'hepsiburada'],
    moatEvents: [
      'scan_result',
      'manual_correction',
      'sold_price',
      'trade_request',
      'repricing_acceptance',
    ],
  };
}

export function buildRepricingSuggestions(
  cards: UserCard[],
  rule: PricingRule = DEFAULT_TRY_PRICING_RULE,
): RepricingSuggestion[] {
  return cards
    .map((item) => {
      const currentPrice = item.purchasePrice ?? 0;
      const suggested = priceForSale(item, rule);
      if (!currentPrice || suggested.amount <= 0) return null;

      const deltaPercent = ((suggested.amount - currentPrice) / currentPrice) * 100;
      if (Math.abs(deltaPercent) < 8) return null;

      return {
        userCardId: item.id,
        name: item.card.name,
        currentPrice,
        suggestedPrice: suggested.amount,
        deltaPercent: Math.round(deltaPercent),
        currency: suggested.currency,
      };
    })
    .filter(Boolean)
    .slice(0, 12) as RepricingSuggestion[];
}

export function calculateGradingRoi(input: GradingRoiInput) {
  const feeRate = (input.platformFeePercent ?? 12) / 100;
  const totalCost = input.rawMarketUsd + input.gradingCostUsd + input.shippingCostUsd;
  const expectedNet = input.gradedMarketUsd * (1 - feeRate);
  const netProfit = expectedNet - totalCost;
  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    totalCost: round(totalCost),
    expectedNet: round(expectedNet),
    netProfit: round(netProfit),
    roiPercent: Math.round(roiPercent),
    shouldGrade: netProfit > 25 && roiPercent >= 25,
  };
}

export function scoreFraudRisk(input: FraudSignalInput) {
  let score = 0;
  const reasons: string[] = [];

  if (!input.scanVerified) {
    score += 35;
    reasons.push('scan_not_verified');
  }
  if ((input.visualConfidence ?? 1) < 0.9) {
    score += 25;
    reasons.push('low_visual_confidence');
  }
  if ((input.marketUsd ?? 0) >= 100) {
    score += 20;
    reasons.push('high_value_card');
  }
  if (!input.hasReferenceImage) {
    score += 10;
    reasons.push('missing_reference_image');
  }
  if (input.condition === 'NM' && (input.marketUsd ?? 0) >= 250) {
    score += 10;
    reasons.push('strict_condition_review');
  }

  const risk = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { score: Math.min(100, score), risk, reasons };
}

export function buildCrossListingPlan(channels: string[], quantity: number) {
  return channels.map((channel) => ({
    channel,
    action: quantity > 0 ? 'publish_or_update' : 'zero_stock',
    quantity,
  }));
}

function round(value: number) {
  return Number(value.toFixed(2));
}
