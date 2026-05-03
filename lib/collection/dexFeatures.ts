import { Condition, Game, UserCard } from '@/types';

export type CollectionSortKey = 'recent' | 'name' | 'value' | 'rarity' | 'set';
export type ExpansionRegion = 'international' | 'japan' | 'china' | 'unknown';

export interface CollectionFilters {
  query?: string;
  game?: Game | 'all';
  condition?: Condition | 'all';
  rarity?: string | 'all';
  foil?: 'all' | 'foil' | 'normal';
  variant?: string | 'all';
  minValueUsd?: number;
  sort?: CollectionSortKey;
}

export interface SmartFolderSummary {
  id: string;
  name: string;
  description: string;
  count: number;
  totalValueUsd: number;
  filter: CollectionFilters;
}

export interface MarketRow {
  source: string;
  label: string;
  currency: 'USD' | 'EUR' | 'JPY' | 'TRY';
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  status: 'live' | 'estimated' | 'missing';
}

export interface DeckSummary {
  totalCards: number;
  uniqueCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  overCopyLimit: string[];
  readyForPlaytest: boolean;
}

export const DEX_PARITY_FEATURES = [
  { id: 'scanner', name: 'Camera scanner', status: 'live' },
  { id: 'expansions', name: 'International, Japan, China expansion catalog', status: 'core_ready' },
  { id: 'variants', name: 'Reverse holo, 1st edition, shadowless and finish variants', status: 'live' },
  { id: 'markets', name: 'TCGPlayer, Cardmarket, eBay and local TRY pricing', status: 'live' },
  { id: 'friends', name: 'Friends, compare and trade graph', status: 'core_ready' },
  { id: 'stats', name: 'Collection, set, value and distribution stats', status: 'live' },
  { id: 'folders', name: 'Custom folders and smart folders', status: 'live' },
  { id: 'deck_builder', name: 'Deck builder and playtest readiness', status: 'live' },
  { id: 'notes', name: 'Card notes and personal metadata', status: 'live' },
  { id: 'badges', name: 'Challenges and handcrafted badges', status: 'live' },
  { id: 'search', name: 'Refined search by name, artist, state, rarity, type and value', status: 'live' },
  { id: 'widgets', name: 'Widget-ready stats snapshots', status: 'core_ready' },
  { id: 'translations', name: 'Multilingual Pokemon aliases', status: 'core_ready' },
  { id: 'themes', name: 'Themes and icon-ready experience settings', status: 'core_ready' },
] as const;

const POKEMON_ALIASES: Record<string, string[]> = {
  charizard: ['dracaufeu', 'リザードン', 'lizardon'],
  pikachu: ['pikachu', 'ピカチュウ'],
  bulbasaur: ['bulbizarre', 'フシギダネ'],
  squirtle: ['carapuce', 'ゼニガメ'],
  mewtwo: ['mewtwo', 'ミュウツー'],
};

export function filterCollection(cards: UserCard[], filters: CollectionFilters): UserCard[] {
  const query = normalize(filters.query ?? '');

  return cards
    .filter((item) => {
      if (filters.game && filters.game !== 'all' && item.card.game !== filters.game) return false;
      if (filters.condition && filters.condition !== 'all' && item.condition !== filters.condition) return false;
      if (filters.rarity && filters.rarity !== 'all' && item.card.rarity !== filters.rarity) return false;
      if (filters.foil === 'foil' && !item.foil) return false;
      if (filters.foil === 'normal' && item.foil) return false;
      if (filters.variant && filters.variant !== 'all' && (item.variant ?? 'normal') !== filters.variant) return false;
      if (filters.minValueUsd && (item.price?.market ?? item.price?.mid ?? 0) < filters.minValueUsd) return false;
      if (!query) return true;

      const searchable = [
        item.card.name,
        item.card.artist,
        item.card.setName,
        item.card.setCode,
        item.card.number,
        item.card.rarity,
        item.condition,
        item.variant,
        item.notes,
        ...aliasesFor(item.card.name),
      ].filter(Boolean).map((value) => normalize(String(value))).join(' ');

      return searchable.includes(query);
    })
    .sort((a, b) => sortCollection(a, b, filters.sort ?? 'recent'));
}

export function buildSmartFolders(cards: UserCard[]): SmartFolderSummary[] {
  const rules: Omit<SmartFolderSummary, 'count' | 'totalValueUsd'>[] = [
    {
      id: 'high_value',
      name: 'High Value',
      description: '$50+ piyasa değeri olan kartlar',
      filter: { minValueUsd: 50, sort: 'value' },
    },
    {
      id: 'duplicates',
      name: 'Trade Fazlası',
      description: 'Adedi 2+ olan takasa uygun kartlar',
      filter: { sort: 'value' },
    },
    {
      id: 'foil',
      name: 'Foil / Holo',
      description: 'Foil, holo veya özel finish kartlar',
      filter: { foil: 'foil', sort: 'set' },
    },
    {
      id: 'missing_price',
      name: 'Fiyat Eksik',
      description: 'Fiyat kaynağı olmayan kartlar',
      filter: { sort: 'recent' },
    },
    {
      id: 'notes',
      name: 'Notlu Kartlar',
      description: 'Kişisel not eklenmiş kartlar',
      filter: { sort: 'recent' },
    },
  ];

  return rules.map((rule) => {
    const matched = cards.filter((item) => matchSmartFolder(rule.id, item));
    return {
      ...rule,
      count: matched.reduce((sum, item) => sum + item.quantity, 0),
      totalValueUsd: matched.reduce(
        (sum, item) => sum + (item.price?.market ?? item.price?.mid ?? 0) * item.quantity,
        0,
      ),
    };
  });
}

export function filterSmartFolder(cards: UserCard[], folderId: string | null): UserCard[] {
  if (!folderId) return cards;
  return cards.filter((item) => matchSmartFolder(folderId, item));
}

export function buildMarketRows(card: UserCard): MarketRow[] {
  const primary = card.price;
  const rows: MarketRow[] = [];

  rows.push({
    source: primary?.source ?? 'primary',
    label: primary?.source?.split(':')[0]?.toUpperCase() ?? 'Primary',
    currency: primary?.currency ?? 'USD',
    low: primary?.low,
    mid: primary?.mid,
    high: primary?.high,
    market: primary?.market,
    status: primary ? 'live' : 'missing',
  });

  const tcg = card.multiPrice?.tcgplayer;
  rows.push({
    source: 'tcgplayer',
    label: 'TCGPlayer',
    currency: 'USD',
    low: tcg?.low,
    mid: tcg?.mid,
    high: tcg?.high,
    market: tcg?.market,
    status: tcg ? 'live' : 'missing',
  });

  const cardmarket = card.multiPrice?.cardmarket;
  rows.push({
    source: 'cardmarket',
    label: 'Cardmarket',
    currency: 'EUR',
    low: cardmarket?.low,
    mid: cardmarket?.avg,
    high: cardmarket?.trend,
    market: cardmarket?.trend,
    status: cardmarket ? 'live' : 'missing',
  });

  if (primary?.mid) {
    rows.push({
      source: 'turkiye',
      label: 'Türkiye',
      currency: 'TRY',
      low: primary.low * 40,
      mid: primary.mid * 40,
      high: primary.high * 40,
      market: (primary.market ?? primary.mid) * 40,
      status: 'estimated',
    });
  }

  return rows;
}

export function buildDeckSummary(cards: UserCard[]): DeckSummary {
  const pokemon = cards.filter((item) => item.card.game === 'pokemon');
  const counts = new Map<string, number>();
  let pokemonCount = 0;
  let trainerCount = 0;
  let energyCount = 0;

  for (const item of pokemon) {
    const name = item.card.name;
    counts.set(name, (counts.get(name) ?? 0) + item.quantity);
    const subtypes = item.card.subtypes ?? [];
    if (subtypes.some((type) => /energy/i.test(type)) || /energy/i.test(name)) energyCount += item.quantity;
    else if (/trainer|item|supporter|stadium/i.test(item.card.supertype ?? '')) trainerCount += item.quantity;
    else pokemonCount += item.quantity;
  }

  const overCopyLimit = Array.from(counts.entries())
    .filter(([name, count]) => count > 4 && !/energy/i.test(name))
    .map(([name]) => name);
  const totalCards = pokemon.reduce((sum, item) => sum + item.quantity, 0);

  return {
    totalCards,
    uniqueCards: pokemon.length,
    pokemonCount,
    trainerCount,
    energyCount,
    overCopyLimit,
    readyForPlaytest: totalCards === 60 && overCopyLimit.length === 0,
  };
}

export function buildWidgetSnapshot(cards: UserCard[]) {
  const smartFolders = buildSmartFolders(cards);
  const totalCards = cards.reduce((sum, item) => sum + item.quantity, 0);
  const mostValuable = [...cards].sort(
    (a, b) => (b.price?.market ?? b.price?.mid ?? 0) - (a.price?.market ?? a.price?.mid ?? 0),
  )[0];

  return {
    totalCards,
    smartFolders,
    mostValuableName: mostValuable?.card.name ?? '',
    mostValuableUsd: mostValuable?.price?.market ?? mostValuable?.price?.mid ?? 0,
    recentlyViewedReady: true,
  };
}

export function inferExpansionRegion(setName: string, series = ''): ExpansionRegion {
  const text = normalize(`${setName} ${series}`);
  if (/\bjapan\b|\bjapanese\b|\bjp\b|sv\-p|s\-p|sm\-p|promo card pack/.test(text)) return 'japan';
  if (/\bchina\b|\bchinese\b|\bcn\b|\bcs\b|\bcsm\b|\bcollector chest chinese\b/.test(text)) return 'china';
  if (!text) return 'unknown';
  return 'international';
}

function matchSmartFolder(id: string, item: UserCard) {
  if (id === 'high_value') return (item.price?.market ?? item.price?.mid ?? 0) >= 50;
  if (id === 'duplicates') return item.quantity > 1;
  if (id === 'foil') return item.foil || /holo|foil|reverse/i.test(item.variant ?? '');
  if (id === 'missing_price') return !item.price;
  if (id === 'notes') return Boolean(item.notes?.trim());
  return false;
}

function sortCollection(a: UserCard, b: UserCard, sort: CollectionSortKey) {
  if (sort === 'name') return a.card.name.localeCompare(b.card.name);
  if (sort === 'value') return (b.price?.market ?? b.price?.mid ?? 0) - (a.price?.market ?? a.price?.mid ?? 0);
  if (sort === 'rarity') return a.card.rarity.localeCompare(b.card.rarity);
  if (sort === 'set') return `${a.card.setName}${a.card.number}`.localeCompare(`${b.card.setName}${b.card.number}`);
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function aliasesFor(name: string) {
  const key = normalize(name).split(' ')[0];
  return POKEMON_ALIASES[key] ?? [];
}

function normalize(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/g, ' ')
    .trim();
}
