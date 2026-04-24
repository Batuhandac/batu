import { Card, CardPrice, ScanResult } from '@/types';

const BASE = 'https://optcgapi.com/api';

export interface OPRawCard {
  id?: string;
  card_id?: string;
  name?: string;
  card_name?: string;
  card_image?: string;
  image?: string;
  rarity?: string;
  set?: string;
  set_id?: string;
  type?: string;
  cost?: string | number;
  power?: string | number;
  counter?: string | number;
  color?: string;
  attribute?: string;
}

export function rawToOPCard(raw: OPRawCard): Card {
  const cardId = raw.card_id ?? raw.id ?? '';
  // OP01-001 → setCode=OP01, number=001
  const parts = cardId.split('-');
  const setCode = parts.length >= 2 ? parts.slice(0, -1).join('-') : '';
  const number = parts[parts.length - 1] ?? cardId;

  return {
    id: '',
    game: 'onepiece',
    apiId: cardId,
    name: raw.card_name ?? raw.name ?? '',
    setName: raw.set ?? raw.set_id ?? setCode,
    setCode,
    number: cardId, // full code like OP01-001
    rarity: raw.rarity ?? 'Common',
    imageUrl: raw.card_image ?? raw.image ?? '',
    supertype: raw.type ?? 'Character',
  };
}

export async function fetchOPCardById(cardId: string): Promise<Card | null> {
  try {
    const normalized = cardId.toUpperCase();
    // Try direct card endpoint first
    const r = await fetch(`${BASE}/sets/card/${normalized}/`);
    if (r.ok) {
      const data: OPRawCard = await r.json();
      if (data.card_id || data.id || data.name || data.card_name) {
        return rawToOPCard({ ...data, card_id: data.card_id ?? normalized });
      }
    }
    // Promo cards (P-001...) may not be indexed — search by exact ID only.
    // Never fall back to "first result" as it could be a completely different card.
    const search = await searchOPCards(normalized, 5);
    const match = search.find((c) => c.number?.toUpperCase() === normalized) ?? null;
    return match;
  } catch {
    return null;
  }
}

export async function searchOPCards(query: string, limit = 10): Promise<Card[]> {
  try {
    const r = await fetch(
      `${BASE}/sets/filtered/?card_name=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!r.ok) return [];
    const data = await r.json();
    const list: OPRawCard[] = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
    return list.map(rawToOPCard);
  } catch {
    return [];
  }
}

export async function fetchOPCardBySetAndNumber(setCode: string, number: string): Promise<Card | null> {
  // Construct OP card ID: setCode + "-" + padded number
  const padded = number.padStart(3, '0');
  const cardId = `${setCode.toUpperCase()}-${padded}`;
  return fetchOPCardById(cardId);
}

export function buildOPScanResult(card: Card, confidence: number): ScanResult {
  return { card, confidence };
}
