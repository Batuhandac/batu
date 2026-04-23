import { Platform } from 'react-native';
import { ScanResult, Card } from '@/types';
import { fetchCardsByQuery, extractBestPrice, tcgCardToCard } from './pokemontcg';
import { fetchOPCardById, fetchOPCardBySetAndNumber, searchOPCards } from './onepiece';
import type { TCGCard } from '@/types';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

interface CardIdentification {
  name: string;
  hp?: string;
  number?: string;
  set?: string;
  era?: 'wizards' | 'modern' | 'kayou' | string;
  features?: string;
  game: 'pokemon' | 'yugioh' | 'mtg' | 'onepiece' | 'naruto' | 'other';
}

const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image.

Identify the game first, then extract fields accordingly.

GAME DETECTION:
- "pokemon": Pokémon TCG (has HP, energy symbols, ©Nintendo/©Wizards)
- "yugioh": Yu-Gi-Oh! (ATK/DEF numbers, KONAMI copyright)
- "mtg": Magic: The Gathering (tap symbol, mana cost top-right, ©Wizards of the Coast)
- "onepiece": One Piece Card Game (Bandai, has DON!! text, leader/character/event card types, card codes like "OP01-001")
- "naruto": Naruto card games — Naruto Kayou (Chinese cards with Naruto characters, KaYou logo) or old Naruto TCG (Bandai/Naruto US cards)
- "other": anything else or not a TCG card

Extract these fields:
- "name": character/card name only. For Pokémon: strip "Basic", "Stage 1/2", "Pokémon VMAX" labels — just the creature name. For One Piece/Naruto: full character name as printed.
- "hp": HP/life value number only (Pokémon). For One Piece leader cards, the life value. Leave empty if not applicable.
- "number":
  • Pokémon: bottom corner number e.g. "87/130", "234/182"
  • One Piece: full card code e.g. "OP01-001", "ST13-003", "P-001"
  • Naruto Kayou: card code e.g. "NT-R001", "BT1-001"
  • Yu-Gi-Oh!/MTG: card number if visible
- "set": set name or expansion name printed on card. For One Piece: e.g. "Romance Dawn", "Paramount War". For Naruto Kayou: series name.
- "era": "wizards" if ©Wizards of the Coast or 1995-2003 dates. "modern" for 2004+. "kayou" for Naruto Kayou cards.
- "features": comma-separated visible features: "Leader", "ex", "GX", "V", "VMAX", "VSTAR", "Full Art", "Secret Rare", "Promo", "Holo", "Reverse Holo", "1st Edition", "Parallel", "Alt Art", "SP"

Reply with ONLY a JSON object. No prose, no markdown, no code fences:
{"name":"...","hp":"...","number":"...","set":"...","era":"...","features":"...","game":"pokemon"}

If image is not a TCG card at all, reply: {"name":"","game":"other"}`;

function cleanBase64(raw: string): string {
  const idx = raw.indexOf(',');
  return idx !== -1 ? raw.slice(idx + 1) : raw;
}

export async function scanCardWithVision(base64: string): Promise<ScanResult[]> {
  const clean = cleanBase64(base64);

  // Web: try GiblTCG vision first (proxied through serverless — no CORS, no key exposure)
  if (Platform.OS === 'web') {
    const gibl = await identifyWithGibl(clean);
    if (gibl) {
      const results = await findCardByGiblIdentity(gibl);
      if (results.length > 0) return results;
    }
  }

  // Claude Vision fallback (web + mobile)
  const identification = await identifyWithClaude(clean);
  if (!identification || !identification.name || identification.game === 'other') return [];
  return routeByGame(identification);
}

async function routeByGame(id: CardIdentification): Promise<ScanResult[]> {
  switch (id.game) {
    case 'onepiece': return findOPCard(id);
    case 'naruto': return buildNarutoResult(id);
    case 'pokemon': return findCardInApi(id);
    default: return findCardInApi(id);
  }
}

async function identifyWithClaude(base64: string): Promise<CardIdentification | null> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.error) return null;
      return data as CardIdentification;
    }

    if (!ANTHROPIC_KEY) return null;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: IDENTIFY_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as CardIdentification;
  } catch {
    return null;
  }
}

function buildNameFilter(name: string): string {
  const needsQuotes = /[\s']/.test(name);
  return needsQuotes ? `name:"${name}"` : `name:${name}`;
}

async function findCardInApi(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  const nameFilter = buildNameFilter(id.name);
  const num = id.number?.split('/')[0]?.trim();
  const hp = id.hp?.trim();
  const setFilter = id.set?.trim() ? `set.name:"${id.set.trim()}"` : '';

  // Try progressively broader queries — most specific first
  const queries: string[] = [];

  if (num && hp && setFilter) queries.push(`${nameFilter} number:${num} hp:${hp} ${setFilter}`);
  if (num && hp) queries.push(`${nameFilter} number:${num} hp:${hp}`);
  if (num && setFilter) queries.push(`${nameFilter} number:${num} ${setFilter}`);
  if (num) queries.push(`${nameFilter} number:${num}`);
  if (hp && setFilter) queries.push(`${nameFilter} hp:${hp} ${setFilter}`);
  if (hp) queries.push(`${nameFilter} hp:${hp}`);
  if (setFilter) queries.push(`${nameFilter} ${setFilter}`);
  queries.push(nameFilter);

  for (const q of queries) {
    const results = await fetchCardsByQuery(q, 10);
    if (results.length === 0) continue;

    const best = pickBestMatch(results, id);
    const result = buildScanResult(best, results.length === 1 ? 0.97 : 0.9);
    const fresh = await fetchFreshPrice(best.id, best.tcgplayerUrl, best.rarity);
    if (fresh) result.price = fresh;
    return [result];
  }

  return [];
}

function pickBestMatch(cards: TCGCard[], id: CardIdentification): TCGCard {
  if (cards.length === 1) return cards[0];

  // Score each card
  const scored = cards.map((c) => {
    let score = 0;
    const num = id.number?.split('/')[0];
    if (num && c.number === num) score += 10;
    if (id.hp && c.hp?.toString() === id.hp) score += 5;
    if (id.set && c.setName.toLowerCase() === id.set.toLowerCase()) score += 8;
    if (id.set && c.setName.toLowerCase().includes(id.set.toLowerCase())) score += 3;
    if (id.era === 'wizards' && /base|jungle|fossil|rocket|gym|neo|wizards/i.test(c.setName)) score += 4;
    if (id.era === 'modern' && !/base|jungle|fossil|rocket|gym|neo|wizards/i.test(c.setName)) score += 2;
    return { card: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].card;
}

async function findOPCard(id: CardIdentification): Promise<ScanResult[]> {
  const num = id.number?.trim();

  // If number looks like a full OP card code (OP01-001, ST01-001, P-001)
  if (num && /^[A-Z0-9]+-\d+$/i.test(num)) {
    const card = await fetchOPCardById(num);
    if (card) return [{ card, confidence: 0.97 }];
  }

  // Try set + number reconstruction
  if (num && id.set) {
    const setCode = id.set.replace(/\s+/g, '').toUpperCase();
    const card = await fetchOPCardBySetAndNumber(setCode, num);
    if (card) return [{ card, confidence: 0.92 }];
  }

  // Name search fallback
  if (id.name) {
    const cards = await searchOPCards(id.name, 5);
    if (cards.length > 0) return [{ card: cards[0], confidence: 0.75 }];
  }

  return [];
}

function buildNarutoResult(id: CardIdentification): ScanResult[] {
  if (!id.name) return [];
  const card: Card = {
    id: '',
    game: 'naruto',
    apiId: id.number ?? `naruto-${Date.now()}`,
    name: id.name,
    setName: id.set ?? '',
    setCode: '',
    number: id.number ?? '',
    rarity: id.features?.includes('SP') ? 'SP' :
            id.features?.includes('Parallel') ? 'Parallel' :
            id.features?.includes('Alt Art') ? 'Alt Art' : 'Common',
    imageUrl: '',
    supertype: 'Character',
  };
  return [{ card, confidence: 0.85 }];
}

interface GiblIdentity {
  name: string;
  setCode: string;
  number: string;
  confidence: number;
  cardType?: string;
}

async function identifyWithGibl(base64: string): Promise<GiblIdentity | null> {
  try {
    const res = await fetch('/api/gibl-scan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found || !data.name) return null;
    return {
      name: data.name as string,
      setCode: (data.setCode as string) ?? '',
      number: (data.number as string) ?? '',
      confidence: (data.confidence as number) ?? 0.9,
      cardType: (data.cardType as string) ?? 'pokemon',
    };
  } catch {
    return null;
  }
}

async function findCardByGiblIdentity({ name, setCode, number, confidence, cardType }: GiblIdentity): Promise<ScanResult[]> {
  // Route non-pokemon games
  if (cardType === 'onepiece') {
    const opId: CardIdentification = { name, number: setCode && number ? `${setCode.toUpperCase()}-${number.padStart(3,'0')}` : number, set: setCode, game: 'onepiece' };
    const r = await findOPCard(opId);
    if (r.length > 0) return r;
  }

  let tcgCard: TCGCard | null = null;
  let conf = confidence;

  if (setCode && number) {
    const r = await fetchCardsByQuery(`set.id:${setCode} number:${number}`, 3);
    if (r.length > 0) { tcgCard = r[0]; conf = Math.min(confidence, 0.99); }
  }
  if (!tcgCard && name && number) {
    const r = await fetchCardsByQuery(`${buildNameFilter(name)} number:${number}`, 5);
    if (r.length > 0) { tcgCard = r[0]; conf = 0.95; }
  }
  if (!tcgCard && name) {
    const r = await fetchCardsByQuery(buildNameFilter(name), 5);
    if (r.length > 0) { tcgCard = r[0]; conf = 0.7; }
  }
  if (!tcgCard) return [];

  const result = buildScanResult(tcgCard, conf);

  // Fetch fresh price from /api/price (supersedes embedded price)
  const fresh = await fetchFreshPrice(tcgCard.id, tcgCard.tcgplayerUrl, tcgCard.rarity);
  if (fresh) result.price = fresh;

  return [result];
}

function buildScanResult(tcgCard: TCGCard, confidence: number): ScanResult {
  const card = tcgCardToCard(tcgCard);
  const rawPrice = extractBestPrice({
    id: tcgCard.id,
    name: tcgCard.name,
    supertype: tcgCard.supertype,
    set: { id: tcgCard.setId, name: tcgCard.setName } as any,
    number: tcgCard.number,
    rarity: tcgCard.rarity,
    images: { small: tcgCard.imageSmall, large: tcgCard.imageLarge },
    tcgplayer: tcgCard.prices?.tcgplayer
      ? { url: tcgCard.tcgplayerUrl ?? '', updatedAt: new Date().toISOString(), prices: tcgCard.prices.tcgplayer as any }
      : undefined,
    cardmarket: tcgCard.prices?.cardmarket
      ? { url: '', updatedAt: new Date().toISOString(), prices: tcgCard.prices.cardmarket as any }
      : undefined,
  });

  return { confidence, card, price: rawPrice ?? undefined };
}

export async function fetchFreshPrice(
  cardId: string,
  tcgplayerUrl: string | undefined,
  rarity: string,
): Promise<import('@/types').CardPrice | null> {
  if (Platform.OS !== 'web') return null;
  try {
    const res = await fetch('/api/price', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId, tcgplayerUrl, rarity }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.market && !d.mid) return null;
    return {
      cardId,
      source: d.source ?? 'api',
      low: d.low ?? 0,
      mid: d.mid ?? d.market ?? 0,
      high: d.high ?? 0,
      market: d.market ?? d.mid ?? 0,
      currency: 'USD',
      cachedAt: d.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
