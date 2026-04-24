import { Card, CardPrice } from '@/types';

const BASE = 'https://api.scryfall.com';

interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
}

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  type_line: string;
  image_uris?: ScryfallImageUris;
  card_faces?: Array<{ name?: string; image_uris?: ScryfallImageUris }>;
  prices: { usd?: string; usd_foil?: string; eur?: string };
}

export function scryfallToCard(raw: ScryfallCard): Card {
  const imageUrl =
    raw.image_uris?.large ??
    raw.image_uris?.normal ??
    raw.card_faces?.[0]?.image_uris?.large ??
    raw.card_faces?.[0]?.image_uris?.normal ??
    '';
  const rarity = raw.rarity.charAt(0).toUpperCase() + raw.rarity.slice(1);
  return {
    id: '',
    game: 'mtg',
    apiId: raw.id,
    name: raw.name,
    setName: raw.set_name,
    setCode: raw.set.toUpperCase(),
    number: raw.collector_number,
    rarity,
    imageUrl,
    supertype: raw.type_line,
  };
}

export function extractMTGPrice(raw: ScryfallCard): CardPrice | null {
  const usd = parseFloat(raw.prices.usd ?? '0') || 0;
  const eur = parseFloat(raw.prices.eur ?? '0') || 0;
  if (usd <= 0 && eur <= 0) return null;
  // Prefer USD; rough EUR→USD conversion if only EUR available
  const market = usd > 0 ? usd : parseFloat((eur * 1.1).toFixed(2));
  return {
    cardId: raw.id,
    source: 'scryfall',
    low: parseFloat((market * 0.85).toFixed(2)),
    mid: parseFloat(market.toFixed(2)),
    high: parseFloat((market * 1.2).toFixed(2)),
    market: parseFloat(market.toFixed(2)),
    currency: 'USD',
    cachedAt: new Date().toISOString(),
  };
}

export async function fetchMTGCard(
  name: string,
  set?: string,
  number?: string,
): Promise<{ card: Card; price: CardPrice | null } | null> {
  const setSlug = set?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  const collectorNum = number?.split('/')?.[0]?.trim();

  // Most precise: set + collector number
  if (setSlug && collectorNum) {
    try {
      const r = await fetch(`${BASE}/cards/${setSlug}/${collectorNum}`);
      if (r.ok) {
        const raw: ScryfallCard = await r.json();
        if (raw.id) return { card: scryfallToCard(raw), price: extractMTGPrice(raw) };
      }
    } catch {}
  }

  // Named search (fuzzy) — Scryfall handles typos and alternate names well
  try {
    const params = new URLSearchParams({ fuzzy: name });
    if (setSlug) params.set('set', setSlug);
    const r = await fetch(`${BASE}/cards/named?${params.toString()}`);
    if (r.ok) {
      const raw: ScryfallCard = await r.json();
      if (raw.id) return { card: scryfallToCard(raw), price: extractMTGPrice(raw) };
    }
  } catch {}

  // Full-text search fallback (returns most recent printing)
  try {
    const q = setSlug ? `!"${name}" set:${setSlug}` : `!"${name}"`;
    const r = await fetch(
      `${BASE}/cards/search?q=${encodeURIComponent(q)}&order=released&dir=desc&unique=prints`,
    );
    if (r.ok) {
      const d = await r.json();
      const raw: ScryfallCard = d.data?.[0];
      if (raw?.id) return { card: scryfallToCard(raw), price: extractMTGPrice(raw) };
    }
  } catch {}

  return null;
}
