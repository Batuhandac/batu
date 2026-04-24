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
  • Old Naruto TCG (2002-2006, Score/Bandai US): bottom-left code like "PR001", "N-001", "M-HOU-001". IMPORTANT: battle stats printed at the bottom (like "3/1", "1/0", "4/2") are NOT the card number — ignore those completely.
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

  if (Platform.OS === 'web') {
    // Run GiblTCG and Claude Vision in parallel — no added latency
    const [gibl, identification] = await Promise.all([
      identifyWithGibl(clean),
      identifyWithClaude(clean),
    ]);

    const cvGame = identification?.game;

    // GiblTCG's predict-card model is reliable only for Pokemon.
    // If Claude Vision disagrees on the game, trust Claude Vision.
    const useGibl =
      gibl &&
      gibl.cardType === 'pokemon' &&
      (cvGame === 'pokemon' || cvGame === 'other' || !cvGame);

    if (useGibl) {
      const results = await findCardByGiblIdentity(gibl!);
      if (results.length > 0) return results;
    }

    if (identification && identification.name && identification.game !== 'other') {
      return routeByGame(identification);
    }

    return [];
  }

  // Mobile: Claude Vision only
  const identification = await identifyWithClaude(clean);
  if (!identification || !identification.name || identification.game === 'other') return [];
  return routeByGame(identification);
}

async function routeByGame(id: CardIdentification): Promise<ScanResult[]> {
  switch (id.game) {
    case 'onepiece': return findOPCard(id);
    case 'naruto': {
      const results = buildNarutoResult(id);
      if (!results.length) return [];
      const ebay = await enrichWithEbay(results[0].card);
      if (ebay.imageUrl) results[0].card = { ...results[0].card, imageUrl: ebay.imageUrl };
      if (ebay.price) results[0].price = ebay.price;
      return results;
    }
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
  let card: Card | null = null;
  let conf = 0.75;

  if (num && /^[A-Z0-9]+-\d+$/i.test(num)) {
    card = await fetchOPCardById(num);
    if (card) conf = 0.97;
  }
  if (!card && num && id.set) {
    const setCode = id.set.replace(/\s+/g, '').toUpperCase();
    card = await fetchOPCardBySetAndNumber(setCode, num);
    if (card) conf = 0.92;
  }
  if (!card && id.name) {
    const cards = await searchOPCards(id.name, 5);
    if (cards.length > 0) { card = cards[0]; conf = 0.75; }
  }
  if (!card) return [];

  // Enrich with eBay price (OPTCG API has no pricing)
  const ebay = await enrichWithEbay(card);
  if (ebay.imageUrl && !card.imageUrl) card = { ...card, imageUrl: ebay.imageUrl };
  return [{ card, confidence: conf, price: ebay.price }];
}

function buildNarutoResult(id: CardIdentification): ScanResult[] {
  if (!id.name) return [];
  const num = id.number ?? '';
  const features = id.features ?? '';
  const isPromo = features.includes('Promo') || /^PR/i.test(num);
  const rarity = isPromo ? 'Promo'
    : features.includes('SP') ? 'SP'
    : features.includes('Parallel') ? 'Parallel'
    : features.includes('Alt Art') ? 'Alt Art'
    : features.includes('Holo') ? 'Holo Rare'
    : features.includes('Secret Rare') ? 'Secret Rare'
    : 'Common';

  const card: Card = {
    id: '',
    game: 'naruto',
    apiId: num || `naruto-${Date.now()}`,
    name: id.name,
    setName: id.set ?? '',
    setCode: '',
    number: num,
    rarity,
    imageUrl: '',
    supertype: 'Ninja',
  };
  return [{ card, confidence: 0.85 }];
}

function buildEbayQuery(name: string, number: string, game: string): string {
  const parts: string[] = [];

  if (game === 'naruto') {
    // Naruto CCG/TCG: use number (NS003), name, and game keyword
    // Don't quote short names — too restrictive on eBay
    if (number) parts.push(number);
    if (name) parts.push(name);
    parts.push('naruto');
  } else if (game === 'onepiece') {
    // One Piece: card code is the most specific identifier
    if (number) parts.push(number);
    if (name) parts.push(name);
    parts.push('one piece card');
  } else if (game === 'yugioh') {
    if (name) parts.push(name);
    if (number) parts.push(number);
    parts.push('yugioh');
  } else {
    if (name) parts.push(`"${name}"`);
    if (number) parts.push(number);
  }

  return parts.join(' ');
}

async function enrichWithEbay(card: Card): Promise<{ imageUrl?: string; price?: import('@/types').CardPrice }> {
  if (Platform.OS !== 'web') return {};
  try {
    // Validation payload — eBay endpoint filters results to titles containing
    // these (with number-format variants handled server-side). Prevents
    // "Kunai NS003" from matching a different "Special Kunai" listing.
    const validate = { name: card.name, number: card.number };

    // Primary: strict query with number + name + game
    const primary = await callEbayLookup(buildEbayQuery(card.name, card.number, card.game), validate);

    // Fallback: broader query (name + game only) — still validated against number
    let fallback = primary;
    if (!primary?.image && card.name) {
      fallback = await callEbayLookup(buildEbayQuery(card.name, '', card.game), validate);
    }

    const result: { imageUrl?: string; price?: import('@/types').CardPrice } = {};
    const best = (primary?.price?.sampleSize ?? 0) >= (fallback?.price?.sampleSize ?? 0) ? primary : fallback;

    if (best?.image) result.imageUrl = best.image;
    const p = best?.price;
    if (p?.market) {
      result.price = {
        cardId: card.apiId,
        source: 'ebay_sold',
        low: p.low,
        mid: p.mid,
        high: p.high,
        market: p.market,
        currency: 'USD',
        cachedAt: new Date().toISOString(),
      };
    }
    return result;
  } catch {
    return {};
  }
}

async function callEbayLookup(query: string, validate?: { name: string; number: string }) {
  try {
    const res = await fetch('/api/ebay-lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, validate }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface GiblIdentity {
  name: string;
  setCode: string;
  number: string;
  confidence: number;
  cardType?: string;
  imageUrl?: string;
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
      imageUrl: (data.imageUrl as string) ?? undefined,
    };
  } catch {
    return null;
  }
}

async function findCardByGiblIdentity({ name, setCode, number, confidence, cardType, imageUrl }: GiblIdentity): Promise<ScanResult[]> {
  // Route non-pokemon games
  if (cardType === 'onepiece') {
    const fullId = setCode && number
      ? `${setCode.toUpperCase()}-${number.padStart(3, '0')}`
      : number;
    const opId: CardIdentification = { name, number: fullId, set: setCode, game: 'onepiece' };
    const r = await findOPCard(opId);
    if (r.length > 0) {
      // GiblTCG image is already matched to the exact card — always prefer it
      if (imageUrl) r[0].card = { ...r[0].card, imageUrl };
      r[0].confidence = confidence;
      return r;
    }
    // OPTCG API failed — build card from GiblTCG data + eBay enrichment
    if (name || imageUrl) {
      const card: Card = {
        id: '',
        game: 'onepiece',
        apiId: fullId || `onepiece-${Date.now()}`,
        name,
        setName: setCode,
        setCode: setCode.toUpperCase(),
        number: fullId,
        rarity: 'Common',
        imageUrl: imageUrl ?? '',
        supertype: 'Character',
      };
      const ebay = await enrichWithEbay(card);
      if (ebay.imageUrl && !card.imageUrl) card.imageUrl = ebay.imageUrl;
      return [{ card, confidence, price: ebay.price }];
    }
  }

  // Naruto: GiblTCG doesn't carry old Naruto TCG (2002 Bandai) — it mismatches
  // to Kayou cards. Always fall through to Claude Vision for naruto so the
  // actual card number (PR001, N-001, etc.) is read from the card text.
  if (cardType === 'naruto') return [];

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
