import { CardPrice, Game } from '@/types';

const BASE_URL = process.env.EXPO_PUBLIC_JUSTTCG_BASE_URL ?? 'https://api.justtcg.com/v1';
const RAW_API_KEY = process.env.EXPO_PUBLIC_JUSTTCG_API_KEY ?? '';
const PLACEHOLDER_KEYS = new Set(['', 'your-justtcg-key', 'placeholder', 'demo']);
const API_KEY = PLACEHOLDER_KEYS.has(RAW_API_KEY) ? '' : RAW_API_KEY;

interface JustTCGPriceResponse {
  card_id: string;
  prices: {
    low: number;
    mid: number;
    high: number;
    market?: number;
  };
  currency: string;
  updated_at: string;
}

const USD_TO_TRY = 38;

export async function fetchCardPrice(game: Game, cardApiId: string): Promise<CardPrice | null> {
  if (!API_KEY) {
    return getMockPrice(cardApiId);
  }

  try {
    const response = await fetch(`${BASE_URL}/prices/${game}/${cardApiId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data: JustTCGPriceResponse = await response.json();

    return {
      cardId: cardApiId,
      source: 'justtcg',
      low: data.prices.low,
      mid: data.prices.mid,
      high: data.prices.high,
      market: data.prices.market,
      currency: 'USD',
      cachedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

export async function fetchBulkPrices(
  game: Game,
  cardApiIds: string[],
): Promise<Record<string, CardPrice>> {
  if (!API_KEY) {
    return Object.fromEntries(
      cardApiIds.map((id) => [id, getMockPrice(id) as CardPrice]),
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/prices/${game}/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ card_ids: cardApiIds }),
    });

    if (!response.ok) return {};

    const data: Record<string, JustTCGPriceResponse> = await response.json();
    const result: Record<string, CardPrice> = {};

    for (const [id, price] of Object.entries(data)) {
      result[id] = {
        cardId: id,
        source: 'justtcg',
        low: price.prices.low,
        mid: price.prices.mid,
        high: price.prices.high,
        market: price.prices.market,
        currency: 'USD',
        cachedAt: price.updated_at,
      };
    }

    return result;
  } catch {
    return {};
  }
}

export function usdToTry(usd: number): number {
  return Math.round(usd * USD_TO_TRY);
}

function getMockPrice(cardApiId: string): CardPrice {
  const seed = cardApiId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = ((seed % 100) + 5) * 2.5;
  return {
    cardId: cardApiId,
    source: 'mock',
    low: parseFloat((base * 0.7).toFixed(2)),
    mid: parseFloat(base.toFixed(2)),
    high: parseFloat((base * 1.5).toFixed(2)),
    market: parseFloat((base * 0.95).toFixed(2)),
    currency: 'USD',
    cachedAt: new Date().toISOString(),
  };
}
