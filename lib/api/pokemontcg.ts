import { Card, CardPrice, Game, TCGCard, SetInfo } from '@/types';

const BASE = 'https://api.pokemontcg.io/v2';
const POKE_KEY = process.env.EXPO_PUBLIC_POKEMONTCG_API_KEY ?? '';
function pokeHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Accept': 'application/json' };
  if (POKE_KEY) h['X-Api-Key'] = POKE_KEY;
  return h;
}

export interface RawTCGSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  printedTotal: number;
  images: { symbol: string; logo: string };
}

export interface RawTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  set: RawTCGSet;
  number: string;
  rarity?: string;
  artist?: string;
  images: { small: string; large: string };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: Record<string, {
      low?: number;
      mid?: number;
      high?: number;
      market?: number;
      directLow?: number;
    }>;
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices?: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
    };
  };
}

const PRICE_VARIANT_PRIORITY = [
  'holofoil',
  'normal',
  'reverseHolofoil',
  'firstEditionHolofoil',
  'firstEditionNormal',
  'unlimitedHolofoil',
  'unlimited',
];

export function extractBestPrice(card: RawTCGCard): CardPrice | null {
  const rarity = (card.rarity ?? '').toLowerCase();
  const isLowRarity = rarity === 'common' || rarity === 'uncommon';

  const tcg = card.tcgplayer?.prices;
  if (tcg) {
    for (const key of PRICE_VARIANT_PRIORITY) {
      const p = tcg[key];
      // Use market price as the reference; fall back to mid if market is absent
      const ref = p?.market ?? p?.mid;
      if (ref && ref > 0) {
        return {
          cardId: card.id,
          source: `tcgplayer:${key}`,
          low: p!.low ?? ref * 0.7,
          mid: p!.mid ?? ref,
          high: p!.high ?? ref * 1.5,
          market: ref,
          currency: 'USD',
          cachedAt: card.tcgplayer!.updatedAt,
        };
      }
    }
    const allKeys = Object.keys(tcg);
    for (const key of allKeys) {
      const p = tcg[key];
      const ref = p?.market ?? p?.mid;
      if (ref && ref > 0) {
        return {
          cardId: card.id,
          source: `tcgplayer:${key}`,
          low: p!.low ?? ref * 0.7,
          mid: p!.mid ?? ref,
          high: p!.high ?? ref * 1.5,
          market: ref,
          currency: 'USD',
          cachedAt: card.tcgplayer!.updatedAt,
        };
      }
    }
  }

  const cm = card.cardmarket?.prices;
  if (cm?.averageSellPrice && cm.averageSellPrice > 0) {
    const EUR_USD = 1.10;
    const avg = cm.averageSellPrice * EUR_USD;
    // CardMarket data for Common/Uncommon cards is often stale or wrong in the TCG API
    if (isLowRarity && avg > 5) return null;
    return {
      cardId: card.id,
      source: 'cardmarket',
      low: (cm.lowPrice ?? cm.averageSellPrice * 0.7) * EUR_USD,
      mid: avg,
      high: (cm.trendPrice ?? cm.averageSellPrice * 1.3) * EUR_USD,
      market: avg,
      currency: 'USD',
      cachedAt: card.cardmarket!.updatedAt,
    };
  }

  return null;
}

export function rawToTCGCard(raw: RawTCGCard): TCGCard {
  return {
    id: raw.id,
    name: raw.name,
    supertype: raw.supertype,
    subtypes: raw.subtypes,
    hp: raw.hp,
    types: raw.types,
    setId: raw.set.id,
    setName: raw.set.name,
    printedTotal: raw.set.printedTotal,
    number: raw.number,
    rarity: raw.rarity ?? 'Common',
    artist: raw.artist,
    imageSmall: raw.images.small,
    imageLarge: raw.images.large,
    tcgplayerUrl: raw.tcgplayer?.url,
    prices: {
      tcgplayer: raw.tcgplayer?.prices as any,
      cardmarket: raw.cardmarket?.prices as any,
    },
  };
}

export function tcgCardToCard(card: TCGCard): Card {
  return {
    id: '',
    game: 'pokemon' as Game,
    apiId: card.id,
    name: card.name,
    setName: card.setName,
    setCode: card.setId,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.imageLarge,
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp ? parseInt(card.hp) : undefined,
    artist: card.artist,
  };
}

export async function fetchAllSets(): Promise<SetInfo[]> {
  try {
    const r = await fetch(`${BASE}/sets?orderBy=-releaseDate&pageSize=250`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!r.ok) return MOCK_SET_LIST;
    const data: { data: RawTCGSet[] } = await r.json();
    return (data.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      releaseDate: s.releaseDate,
      total: s.total,
      printedTotal: s.printedTotal,
      game: 'pokemon',
      logoUrl: s.images.logo,
      symbolUrl: s.images.symbol,
    }));
  } catch {
    return MOCK_SET_LIST;
  }
}

export async function fetchSetCards(
  setId: string,
  page = 1,
  pageSize = 36,
): Promise<{ cards: TCGCard[]; total: number }> {
  try {
    const r = await fetch(
      `${BASE}/cards?q=set.id:${setId}&orderBy=number&page=${page}&pageSize=${pageSize}`,
      { headers: pokeHeaders() },
    );
    if (!r.ok) return { cards: [], total: 0 };
    const data: { data: RawTCGCard[]; totalCount: number } = await r.json();
    return {
      cards: (data.data ?? []).map(rawToTCGCard),
      total: data.totalCount ?? 0,
    };
  } catch {
    return { cards: [], total: 0 };
  }
}

export async function fetchCardsByQuery(query: string, pageSize = 20): Promise<TCGCard[]> {
  if (!query.trim()) return [];
  try {
    const r = await fetch(
      `${BASE}/cards?q=${encodeURIComponent(query)}&pageSize=${pageSize}`,
      { headers: pokeHeaders() },
    );
    if (!r.ok) return [];
    const data: { data: RawTCGCard[] } = await r.json();
    return (data.data ?? []).map(rawToTCGCard);
  } catch {
    return [];
  }
}

export async function searchTCGCards(query: string, page = 1): Promise<{ cards: TCGCard[]; total: number }> {
  if (!query.trim()) return { cards: [], total: 0 };
  try {
    const q = encodeURIComponent(`name:${query}*`);
    const r = await fetch(
      `${BASE}/cards?q=${q}&orderBy=name&page=${page}&pageSize=36`,
      { headers: pokeHeaders() },
    );
    if (!r.ok) return { cards: [], total: 0 };
    const data: { data: RawTCGCard[]; totalCount: number } = await r.json();
    return {
      cards: (data.data ?? []).map(rawToTCGCard),
      total: data.totalCount ?? 0,
    };
  } catch {
    return { cards: [], total: 0 };
  }
}

export async function fetchCardById(id: string): Promise<TCGCard | null> {
  try {
    const r = await fetch(`${BASE}/cards/${id}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!r.ok) return null;
    const data: { data: RawTCGCard } = await r.json();
    return rawToTCGCard(data.data);
  } catch {
    return null;
  }
}

export async function fetchCardPrice(cardId: string): Promise<CardPrice | null> {
  const card = await fetchCardById(cardId);
  if (!card) return null;
  const raw: RawTCGCard = {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    set: { id: card.setId, name: card.setName } as RawTCGSet,
    number: card.number,
    rarity: card.rarity,
    images: { small: card.imageSmall, large: card.imageLarge },
    tcgplayer: card.prices?.tcgplayer ? { url: '', updatedAt: new Date().toISOString(), prices: card.prices.tcgplayer as any } : undefined,
    cardmarket: card.prices?.cardmarket ? { url: '', updatedAt: new Date().toISOString(), prices: card.prices.cardmarket as any } : undefined,
  };
  return extractBestPrice(raw);
}

const MOCK_SET_LIST: SetInfo[] = [
  { id: 'sv8', name: 'Surging Sparks', series: 'Scarlet & Violet', releaseDate: '2024/11/08', total: 252, game: 'pokemon' },
  { id: 'sv7', name: 'Stellar Crown', series: 'Scarlet & Violet', releaseDate: '2024/09/13', total: 175, game: 'pokemon' },
  { id: 'sv6pt5', name: 'Shrouded Fable', series: 'Scarlet & Violet', releaseDate: '2024/08/02', total: 99, game: 'pokemon' },
  { id: 'sv6', name: 'Twilight Masquerade', series: 'Scarlet & Violet', releaseDate: '2024/05/24', total: 226, game: 'pokemon' },
  { id: 'sv5', name: 'Temporal Forces', series: 'Scarlet & Violet', releaseDate: '2024/03/22', total: 218, game: 'pokemon' },
  { id: 'sv4pt5', name: 'Paldean Fates', series: 'Scarlet & Violet', releaseDate: '2024/01/26', total: 245, game: 'pokemon' },
  { id: 'sv4', name: 'Paradox Rift', series: 'Scarlet & Violet', releaseDate: '2023/11/03', total: 266, game: 'pokemon' },
  { id: 'sv3pt5', name: 'Pokemon Card 151', series: 'Scarlet & Violet', releaseDate: '2023/09/22', total: 207, game: 'pokemon' },
  { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', releaseDate: '2023/08/11', total: 230, game: 'pokemon' },
  { id: 'sv2', name: 'Paldea Evolved', series: 'Scarlet & Violet', releaseDate: '2023/06/09', total: 279, game: 'pokemon' },
  { id: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet', releaseDate: '2023/03/31', total: 264, game: 'pokemon' },
  { id: 'swsh12pt5', name: 'Crown Zenith', series: 'Sword & Shield', releaseDate: '2023/01/20', total: 230, game: 'pokemon' },
];
