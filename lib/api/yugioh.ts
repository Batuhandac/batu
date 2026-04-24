import { Card, CardPrice } from '@/types';

const BASE = 'https://db.ygoprodeck.com/api/v7';

interface YGOSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
}

interface YGORawCard {
  id: number;
  name: string;
  type: string;
  race?: string;
  attribute?: string;
  level?: number;
  card_sets?: YGOSet[];
  card_images: Array<{ id: number; image_url: string; image_url_small: string }>;
  card_prices: Array<{
    tcgplayer_price: string;
    cardmarket_price: string;
    ebay_price: string;
  }>;
}

export function ygoToCard(raw: YGORawCard, matchedSet?: YGOSet): Card {
  const set = matchedSet ?? raw.card_sets?.[0];
  return {
    id: '',
    game: 'yugioh',
    apiId: String(raw.id),
    name: raw.name,
    setName: set?.set_name ?? '',
    setCode: set?.set_code?.replace(/-[^-]+$/, '') ?? '',
    number: set?.set_code ?? String(raw.id),
    rarity: set?.set_rarity ?? raw.type,
    imageUrl: raw.card_images[0]?.image_url ?? '',
    supertype: raw.type,
  };
}

export function extractYGOPrice(raw: YGORawCard): CardPrice | null {
  const p = raw.card_prices?.[0];
  if (!p) return null;
  const tcg = parseFloat(p.tcgplayer_price) || 0;
  const cm = parseFloat(p.cardmarket_price) || 0;
  const ebay = parseFloat(p.ebay_price) || 0;
  const values = [tcg, cm, ebay].filter((v) => v > 0);
  if (!values.length) return null;
  const market = tcg > 0 ? tcg : cm > 0 ? cm : ebay;
  return {
    cardId: String(raw.id),
    source: tcg > 0 ? 'tcgplayer' : 'cardmarket',
    low: parseFloat(Math.min(...values).toFixed(2)),
    mid: parseFloat(market.toFixed(2)),
    high: parseFloat(Math.max(...values).toFixed(2)),
    market: parseFloat(market.toFixed(2)),
    currency: 'USD',
    cachedAt: new Date().toISOString(),
  };
}

export async function fetchYGOCard(
  name: string,
  passcode?: string,
  setCode?: string,
): Promise<{ card: Card; price: CardPrice | null } | null> {
  // Most precise: 7-8 digit passcode printed at the bottom of every card
  if (passcode && /^\d{7,8}$/.test(passcode.trim())) {
    const r = await getOne(`${BASE}/cardinfo.php?id=${passcode.trim()}`);
    if (r) return build(r, setCode);
  }

  // Exact name
  const exact = await getOne(`${BASE}/cardinfo.php?name=${encodeURIComponent(name)}`);
  if (exact) return build(exact, setCode);

  // Fuzzy fallback
  const fuzzy = await getOne(`${BASE}/cardinfo.php?fname=${encodeURIComponent(name)}&num=5&offset=0`);
  if (fuzzy) return build(fuzzy, setCode);

  return null;
}

async function getOne(url: string): Promise<YGORawCard | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    return (d.data as YGORawCard[])?.[0] ?? null;
  } catch {
    return null;
  }
}

function build(
  raw: YGORawCard,
  setCode?: string,
): { card: Card; price: CardPrice | null } {
  const matchedSet = setCode
    ? raw.card_sets?.find((s) =>
        s.set_code.toUpperCase().startsWith(setCode.toUpperCase()),
      )
    : raw.card_sets?.[0];
  return { card: ygoToCard(raw, matchedSet), price: extractYGOPrice(raw) };
}
