import { Platform } from 'react-native';
import { ScanResult, Card } from '@/types';
import { fetchCardsByQuery, extractBestPrice, tcgCardToCard } from './pokemontcg';
import { fetchOPCardById, fetchOPCardBySetAndNumber, searchOPCards } from './onepiece';
import { fetchYGOCard } from './yugioh';
import { fetchMTGCard } from './mtg';
import type { TCGCard } from '@/types';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

interface CardIdentification {
  name: string;
  hp?: string;
  number?: string;
  set?: string;
  era?: 'wizards' | 'modern' | 'kayou' | string;
  features?: string;
  game: 'pokemon' | 'yugioh' | 'mtg' | 'onepiece' | 'lorcana' | 'naruto' | 'other';
}

const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image. Identify the game first, then extract fields.

GAME DETECTION:
- "pokemon": Pokémon TCG — has HP value, energy symbols, ©Nintendo/©Wizards
- "yugioh": Yu-Gi-Oh! — ATK/DEF numbers at bottom, KONAMI copyright, horizontal landscape layout or portrait with colored border
- "mtg": Magic: The Gathering — mana cost top-right, tap symbol, ©Wizards of the Coast, collector number bottom-left like "233/273"
- "onepiece": One Piece Card Game — BANDAI copyright, DON!! mechanic text, card codes like "OP01-001" or "P-001", ONE PIECE branding
- "lorcana": Disney Lorcana — Disney copyright, ink drop symbols, lore/strength values, Disney character art
- "naruto": Naruto card games — Naruto Kayou (KaYou logo, Chinese) or old Naruto TCG (Bandai/Score US, ©2002 Masashi Kishimoto)
- "other": not a TCG card

FIELD EXTRACTION:
- "name": character/card name only. Strip "Basic", "Stage 1/2", "VMAX" labels — just the creature/character name.
- "hp": HP/life value (Pokémon only).
- "number":
  • Pokémon: bottom corner e.g. "87/130", "234/182"
  • One Piece: full card code e.g. "OP01-001", "ST13-003", "P-001"
  • Yu-Gi-Oh!: the 8-DIGIT PASSCODE at the very bottom-left corner (e.g. "46986414"). This is NOT the ATK or DEF value. Do NOT confuse with ATK/DEF numbers.
  • Magic: The Gathering: collector number bottom-left e.g. "233/273" or "233"
  • Lorcana: collector number if visible
  • Naruto Kayou: card code e.g. "NT-R001", "BT1-001"
  • Old Naruto TCG (2002-2006): bottom-left code like "PR001", "N-001", "M-HOU-001". IMPORTANT: battle stats at the bottom (like "3/1", "1/0", "4/2") are NOT card numbers — ignore them.
- "set": set name or code printed on the card.
- "era": "wizards" for ©Wizards or 1995-2003 Pokémon. "modern" for 2004+ Pokémon. "kayou" for Naruto Kayou.
- "features": comma-separated: ex, GX, V, VMAX, VSTAR, Leader, Holo, Reverse Holo, Secret Rare, Full Art, Alt Art, 1st Edition, Promo, Enchanted, SP, Parallel

Reply with ONLY valid JSON. No prose, no markdown, no code fences:
{"name":"...","hp":"...","number":"...","set":"...","era":"...","features":"...","game":"pokemon"}

If it is not a TCG card at all: {"name":"","game":"other"}`;

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

    // GiblTCG predict-card is reliable only for Pokémon.
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
    case 'pokemon': return findCardInApi(id);
    case 'onepiece': return findOPCard(id);
    case 'yugioh': return findYGOCard(id);
    case 'mtg': return findMTGCard(id);
    case 'naruto': return findNarutoCard(id);
    case 'lorcana': return findLorcanaCard(id);
    default: return findCardInApi(id);
  }
}

// ── POKEMON ────────────────────────────────────────────────────────────────

async function findCardInApi(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  const nameFilter = buildNameFilter(id.name);
  const num = id.number?.split('/')[0]?.trim();
  const hp = id.hp?.trim();
  const setFilter = id.set?.trim() ? `set.name:"${id.set.trim()}"` : '';

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
    if (!results.length) continue;
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

// ── ONE PIECE ───────────────────────────────────────────────────────────────

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
  // Only name-search when we have NO specific card number.
  // With a number (e.g. P-001), a name search returns a different printing of
  // the same character — which is a wrong card, not a fallback.
  if (!card && id.name && !num) {
    const cards = await searchOPCards(id.name, 5);
    if (cards.length > 0) { card = cards[0]; conf = 0.75; }
  }
  // OPTCG doesn't have the card (e.g. promo P-001) — build from Claude Vision
  // data and let eBay provide the image and price for this specific number.
  if (!card && id.name) {
    card = {
      id: '',
      game: 'onepiece',
      apiId: num || `onepiece-${Date.now()}`,
      name: id.name,
      setName: id.set ?? '',
      setCode: num?.split('-')[0] ?? '',
      number: num ?? '',
      rarity: id.features?.includes('Promo') ? 'Promo' : 'Common',
      imageUrl: '',
      supertype: 'Character',
    };
    conf = 0.80;
  }
  if (!card) return [];

  const ebay = await enrichWithEbay(card);
  if (ebay.imageUrl && !card.imageUrl) card = { ...card, imageUrl: ebay.imageUrl };
  return [{ card, confidence: conf, price: ebay.price }];
}

// ── YU-GI-OH ────────────────────────────────────────────────────────────────

async function findYGOCard(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  // id.number may be the 8-digit passcode OR a set code like "LOB-005"
  const isPasscode = id.number ? /^\d{7,8}$/.test(id.number.trim()) : false;
  const passcode = isPasscode ? id.number : undefined;
  const setCode = !isPasscode && id.number ? id.number : undefined;

  const result = await fetchYGOCard(id.name, passcode, setCode);
  if (!result) return [];

  const { card, price } = result;
  return [{ card, confidence: isPasscode ? 0.99 : 0.9, price: price ?? undefined }];
}

// ── MAGIC: THE GATHERING ────────────────────────────────────────────────────

async function findMTGCard(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  const result = await fetchMTGCard(id.name, id.set, id.number);
  if (!result) return [];

  const { card, price } = result;
  return [{ card, confidence: id.number ? 0.95 : 0.88, price: price ?? undefined }];
}

// ── NARUTO ──────────────────────────────────────────────────────────────────

async function findNarutoCard(id: CardIdentification): Promise<ScanResult[]> {
  const results = buildNarutoResult(id);
  if (!results.length) return [];
  const ebay = await enrichWithEbay(results[0].card);
  if (ebay.imageUrl) results[0].card = { ...results[0].card, imageUrl: ebay.imageUrl };
  if (ebay.price) results[0].price = ebay.price;
  return results;
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

// ── LORCANA ─────────────────────────────────────────────────────────────────

async function findLorcanaCard(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];
  const features = id.features ?? '';
  const rarity = features.includes('Enchanted') ? 'Enchanted'
    : features.includes('Super Rare') ? 'Super Rare'
    : features.includes('Rare') ? 'Rare'
    : features.includes('Uncommon') ? 'Uncommon'
    : 'Common';

  const card: Card = {
    id: '',
    game: 'lorcana',
    apiId: id.number || `lorcana-${Date.now()}`,
    name: id.name,
    setName: id.set ?? '',
    setCode: '',
    number: id.number ?? '',
    rarity,
    imageUrl: '',
    supertype: 'Character',
  };

  const ebay = await enrichWithEbay(card);
  if (ebay.imageUrl) card.imageUrl = ebay.imageUrl;
  return [{ card, confidence: 0.82, price: ebay.price }];
}

// ── EBAY ENRICHMENT ─────────────────────────────────────────────────────────

function buildEbayQuery(name: string, number: string, game: string): string {
  const parts: string[] = [];
  switch (game) {
    case 'naruto':
      if (number) parts.push(number);
      if (name) parts.push(name);
      parts.push('naruto');
      break;
    case 'onepiece':
      if (number) parts.push(number);
      if (name) parts.push(name);
      // Promo codes (P-001, P-002...) add "promo" since sellers often omit the code
      if (number && /^P-\d+$/i.test(number)) parts.push('promo');
      parts.push('one piece card');
      break;
    case 'yugioh':
      if (name) parts.push(`"${name}"`);
      // Skip 8-digit passcode on eBay — it's internal YGO numbering, not in listing titles
      if (number && !/^\d{7,8}$/.test(number)) parts.push(number);
      parts.push('yugioh');
      break;
    case 'mtg':
      if (name) parts.push(`"${name}"`);
      parts.push('mtg magic');
      break;
    case 'lorcana':
      if (name) parts.push(`"${name}"`);
      parts.push('lorcana');
      break;
    default:
      if (name) parts.push(`"${name}"`);
      if (number) parts.push(number);
  }
  return parts.join(' ');
}

async function enrichWithEbay(card: Card): Promise<{ imageUrl?: string; price?: import('@/types').CardPrice }> {
  if (Platform.OS !== 'web') return {};
  try {
    const validate = { name: card.name, number: card.number };

    const primary = await callEbayLookup(buildEbayQuery(card.name, card.number, card.game), validate);

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

// ── GIBL TCG ────────────────────────────────────────────────────────────────

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

async function findCardByGiblIdentity({
  name,
  setCode,
  number,
  confidence,
  cardType,
}: GiblIdentity): Promise<ScanResult[]> {
  // GiblTCG predict-card is only reliable for Pokémon — all other games
  // are handled by Claude Vision via routeByGame.
  if (cardType !== 'pokemon') return [];

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
  const fresh = await fetchFreshPrice(tcgCard.id, tcgCard.tcgplayerUrl, tcgCard.rarity);
  if (fresh) result.price = fresh;

  return [result];
}

// ── CLAUDE VISION ───────────────────────────────────────────────────────────

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

// ── UTILITIES ────────────────────────────────────────────────────────────────

function buildNameFilter(name: string): string {
  const needsQuotes = /[\s']/.test(name);
  return needsQuotes ? `name:"${name}"` : `name:${name}`;
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
