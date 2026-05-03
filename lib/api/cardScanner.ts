import { ScanResult, Card } from '@/types';
import { fetchCardsByQuery, extractBestPrice, tcgCardToCard } from './pokemontcg';
import { fetchOPCardById, fetchOPCardBySetAndNumber, searchOPCards } from './onepiece';
import { fetchYGOCard, ygoToCard, extractYGOPrice } from './yugioh';
import { fetchMTGCard, scryfallToCard, extractMTGPrice } from './mtg';
import { postServerApi } from './serverApi';
import type { TCGCard } from '@/types';

const MIN_STRONG_PROVIDER_CONFIDENCE = 0.88;

interface CardIdentification {
  name: string;
  hp?: string;
  number?: string;
  printedTotal?: string;
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

const EXACT_PRINT_PROMPT = `${IDENTIFY_PROMPT}

EXACT PRINTING RULES:
- The goal is exact physical printing, not just the character name.
- For Pokemon, read the bottom set/card number exactly and capture visible rarity/foil cues such as Holo, Reverse Holo, Secret Rare, 1st Edition, Promo, Full Art, Alt Art.
- For Yu-Gi-Oh!, prefer the printed set code such as LOB-001, RA01-EN000, SDY-006. Use the 7-8 digit passcode only when no printed set code is visible.
- When a printed code is visible, put it in "number"; for Yu-Gi-Oh! also put it in "set".
- If glare, crop, or blur prevents exact print identification, still return the best fields you can read but do not invent set, number, or rarity.`;

function cleanBase64(raw: string): string {
  const idx = raw.indexOf(',');
  return idx !== -1 ? raw.slice(idx + 1) : raw;
}

export async function scanCardWithVision(base64: string): Promise<ScanResult[]> {
  const clean = cleanBase64(base64);

  {
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
      const results = await findCardByGiblIdentity(gibl!, identification, clean);
      if (results.length > 0) return prioritizeScanResults(results);
    }

    if (identification && identification.name && identification.game !== 'other') {
      return prioritizeScanResults(await routeByGame(identification, clean));
    }

    return [];
  }
}

async function routeByGame(id: CardIdentification, sourceImageBase64?: string): Promise<ScanResult[]> {
  switch (id.game) {
    case 'pokemon': return findCardInApi(id, sourceImageBase64);
    case 'onepiece': return findOPCard(id);
    case 'yugioh': return findYGOCard(id);
    case 'mtg': return findMTGCard(id);
    case 'naruto': return findNarutoCard(id);
    case 'lorcana': return findLorcanaCard(id);
    default: return findCardInApi(id, sourceImageBase64);
  }
}

// ── POKEMON ────────────────────────────────────────────────────────────────

async function findCardInApi(id: CardIdentification, sourceImageBase64?: string): Promise<ScanResult[]> {
  if (!id.name) return [];

  const nameFilter = buildNameFilter(id.name);
  const num = id.number?.split('/')[0]?.trim();
  const printedTotal = id.printedTotal?.trim() ?? id.number?.split('/')[1]?.trim();
  const hp = id.hp?.trim();
  const set = id.set?.trim();
  const setFilter = set ? buildPokemonSetFilter(set) : '';

  const queries: string[] = [];
  const exactQueries: string[] = [];
  const numberFilters = num ? numberQueryVariants(num) : [];
  for (const numberFilter of numberFilters) {
    if (setFilter && printedTotal) exactQueries.push(`${nameFilter} number:${numberFilter} ${setFilter} set.printedTotal:${printedTotal}`);
    if (setFilter) exactQueries.push(`${nameFilter} number:${numberFilter} ${setFilter}`);
    if (printedTotal) exactQueries.push(`${nameFilter} number:${numberFilter} set.printedTotal:${printedTotal}`);
  }
  queries.push(...exactQueries);
  for (const numberFilter of numberFilters) {
    if (hp && setFilter) queries.push(`${nameFilter} number:${numberFilter} hp:${hp} ${setFilter}`);
    if (hp) queries.push(`${nameFilter} number:${numberFilter} hp:${hp}`);
    if (setFilter) queries.push(`${nameFilter} number:${numberFilter} ${setFilter}`);
    queries.push(`${nameFilter} number:${numberFilter}`);
  }
  if (hp && setFilter) queries.push(`${nameFilter} hp:${hp} ${setFilter}`);
  if (hp) queries.push(`${nameFilter} hp:${hp}`);
  if (setFilter) queries.push(`${nameFilter} ${setFilter}`);
  queries.push(nameFilter);

  for (const q of exactQueries) {
    const exact = await fetchCardsByQuery(q, 5);
    if (exact.length !== 1) continue;

    const result = buildScanResult(exact[0], 0.99);
    result.verification = verifyPokemonResult(exact[0], id, 1);
    const fresh = await fetchFreshPrice(exact[0].id, exact[0].tcgplayerUrl, exact[0].rarity);
    if (fresh) result.price = fresh;
    return prioritizeScanResults([await verifyAgainstReferenceImage(result, sourceImageBase64)]);
  }

  const candidates = new Map<string, TCGCard>();

  for (const q of queries) {
    const results = await fetchCardsByQuery(q, 10);
    for (const card of results) candidates.set(card.id, card);
  }

  if (!candidates.size) return [];

  const ranked = rankPokemonMatches([...candidates.values()], id);
  const confident = ranked.filter((m) => m.confidence >= 0.72);
  const selected = confident.length ? confident : ranked.slice(0, 3);

  const scanResults = await Promise.all(
    selected.slice(0, 4).map(async ({ card, confidence }) => {
      const result = buildScanResult(card, confidence);
      result.verification = verifyPokemonResult(card, id, selected.length);
      const fresh = await fetchFreshPrice(card.id, card.tcgplayerUrl, card.rarity);
      if (fresh) result.price = fresh;
      return verifyAgainstReferenceImage(result, sourceImageBase64);
    }),
  );

  return prioritizeScanResults(scanResults);
}

function buildPokemonSetFilter(set: string): string {
  const trimmed = set.trim();
  if (/^[a-z]{2,}\d+[a-z0-9-]*$/i.test(trimmed)) return `set.id:${trimmed}`;
  return `set.name:"${trimmed}"`;
}

function rankPokemonMatches(cards: TCGCard[], id: CardIdentification): Array<{ card: TCGCard; confidence: number; score: number }> {
  const num = id.number?.split('/')[0]?.trim();
  const set = id.set?.trim();
  const printedTotal = id.printedTotal?.trim() ?? id.number?.split('/')[1]?.trim();
  const hp = id.hp?.trim();
  const featureText = normalizeText(id.features ?? '');

  const scored = cards.map((c) => {
    let score = 0;
    const exactPrintSignals = { number: false, set: false, printedTotal: false, hp: false };

    if (normalizeText(c.name) === normalizeText(id.name)) score += 12;
    else if (normalizeText(c.name).includes(normalizeText(id.name))) score += 6;

    if (num && sameCardNumber(c.number, num)) {
      score += 24;
      exactPrintSignals.number = true;
    }

    if (hp && c.hp?.toString() === hp) {
      score += 8;
      exactPrintSignals.hp = true;
    }

    if (set) {
      const normalizedSet = normalizeText(set);
      if (normalizeText(c.setId) === normalizedSet) {
        score += 24;
        exactPrintSignals.set = true;
      } else if (normalizeText(c.setName) === normalizedSet) {
        score += 20;
        exactPrintSignals.set = true;
      } else if (normalizeText(c.setName).includes(normalizedSet)) {
        score += 8;
      }
    }

    if (printedTotal && String(c.printedTotal ?? '') === printedTotal) {
      score += 18;
      exactPrintSignals.printedTotal = true;
    }

    if (id.era === 'wizards' && /base|jungle|fossil|rocket|gym|neo|wizards/i.test(c.setName)) score += 4;
    if (id.era === 'modern' && !/base|jungle|fossil|rocket|gym|neo|wizards/i.test(c.setName)) score += 2;

    const rarityText = normalizeText(c.rarity);
    if (featureText.includes('reverse') && rarityText.includes('reverse')) score += 7;
    if (featureText.includes('holo') && rarityText.includes('holo')) score += 5;
    if (featureText.includes('secret') && rarityText.includes('secret')) score += 7;
    if (featureText.includes('promo') && rarityText.includes('promo')) score += 7;

    let confidence = 0.62;
    if (exactPrintSignals.number && exactPrintSignals.set) confidence = 0.99;
    else if (exactPrintSignals.number && exactPrintSignals.printedTotal) confidence = 0.98;
    else if (exactPrintSignals.number && exactPrintSignals.hp) confidence = 0.92;
    else if (exactPrintSignals.number) confidence = 0.84;
    else if (exactPrintSignals.set && exactPrintSignals.hp) confidence = 0.78;

    if (featureText && (featureText.includes('holo') || featureText.includes('reverse') || featureText.includes('secret'))) {
      confidence = Math.min(0.99, confidence + 0.02);
    }

    return { card: c, confidence, score };
  });

  scored.sort((a, b) => b.score - a.score || b.confidence - a.confidence);
  const best = scored[0];
  return scored.map((item, index) => {
    const closeToBest = best && best.score - item.score <= 6;
    const confidence = index === 0 || closeToBest ? item.confidence : Math.min(item.confidence, 0.74);
    return { ...item, confidence };
  });
}

function verifyPokemonResult(card: TCGCard, id: CardIdentification, candidateCount: number): ScanResult['verification'] {
  const reasons: string[] = [];
  const num = id.number?.split('/')[0]?.trim();
  const printedTotal = id.printedTotal?.trim() ?? id.number?.split('/')[1]?.trim();
  const set = id.set?.trim();

  if (normalizeText(card.name) === normalizeText(id.name)) reasons.push('name');
  if (num && sameCardNumber(card.number, num)) reasons.push('number');
  if (set && (normalizeText(card.setId) === normalizeText(set) || normalizeText(card.setName) === normalizeText(set))) reasons.push('set');
  if (printedTotal && String(card.printedTotal ?? '') === printedTotal) reasons.push('printedTotal');
  if (id.hp && card.hp?.toString() === id.hp) reasons.push('hp');

  const hasExactPrint = reasons.includes('number') && (reasons.includes('set') || reasons.includes('printedTotal'));
  const status = hasExactPrint && candidateCount === 1 ? 'verified' : 'needs_review';

  return { status, provider: 'pokemontcg', reasons };
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeCardNumber(value: string | undefined): string {
  const raw = String(value ?? '').trim();
  const [number] = raw.split('/');
  const compact = number.trim();
  return compact.replace(/^0+(\d)/, '$1');
}

function sameCardNumber(left: string | undefined, right: string | undefined): boolean {
  return !!left && !!right && normalizeCardNumber(left) === normalizeCardNumber(right);
}

function numberQueryVariants(value: string): string[] {
  const raw = value.trim();
  const normalized = normalizeCardNumber(raw);
  return [...new Set([raw, normalized].filter(Boolean))];
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
  let authoritative = false;

  if (num && /^[A-Z0-9]+-\d+$/i.test(num)) {
    card = await fetchOPCardById(num);
    if (card) {
      conf = 0.97;
      authoritative = true;
    }
  }
  if (!card && num && id.set) {
    const setCode = id.set.replace(/\s+/g, '').toUpperCase();
    card = await fetchOPCardBySetAndNumber(setCode, num);
    if (card) {
      conf = 0.92;
      authoritative = true;
    }
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
  return [{
    card,
    confidence: conf,
    price: ebay.price,
    verification: verifyOnePieceResult(card, id, authoritative),
  }];
}

function verifyOnePieceResult(card: Card, id: CardIdentification, authoritative: boolean): ScanResult['verification'] {
  const reasons: string[] = [];
  const expectedCode = id.number?.trim().toUpperCase();

  if (normalizeText(card.name).includes(normalizeText(id.name))) reasons.push('name');
  if (expectedCode && card.number.toUpperCase() === expectedCode) reasons.push('printedCode');
  if (id.set && normalizeText(card.setName).includes(normalizeText(id.set))) reasons.push('set');

  return {
    status: authoritative && reasons.includes('printedCode') ? 'verified' : 'needs_review',
    provider: 'optcgapi',
    reasons,
  };
}

// ── YU-GI-OH ────────────────────────────────────────────────────────────────

async function findYGOCard(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  const printedCode = pickYGOPrintedCode(id);
  const isPasscode = id.number ? /^\d{7,8}$/.test(id.number.trim()) : false;
  const passcode = !printedCode && isPasscode ? id.number : undefined;
  const setCode = printedCode;

  const result = await fetchYGOCard(id.name, passcode, setCode);
  if (!result) return [];

  const conf = setCode ? 0.98 : isPasscode ? 0.9 : 0.78;
  const primary: ScanResult = {
    card: result.card,
    confidence: conf,
    price: result.price ?? undefined,
    verification: {
      status: setCode ? 'verified' : 'needs_review',
      provider: 'ygoprodeck',
      reasons: setCode ? ['printedSetCode'] : isPasscode ? ['passcode'] : ['name'],
    },
  };

  // If not matched by passcode, fetch alternative printings (different sets/rarities)
  // so user can pick the exact version they have
  if (!isPasscode) {
    const alts = await fetchYGOAlternatives(id.name, result.card.apiId);
    if (alts.length) return [primary, ...alts];
  }

  return [primary];
}

function pickYGOPrintedCode(id: CardIdentification): string | undefined {
  const values = [id.number, id.set].filter(Boolean) as string[];
  return values.find((value) => /^[A-Z0-9]{2,8}-[A-Z0-9]{2,8}$/i.test(value.trim()))?.trim();
}

async function fetchYGOAlternatives(name: string, excludeApiId: string): Promise<ScanResult[]> {
  try {
    const r = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(name)}&num=4&offset=0`,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.data ?? [])
      .filter((raw: any) => String(raw.id) !== excludeApiId)
      .slice(0, 2)
      .map((raw: any) => ({
        card: ygoToCard(raw),
        confidence: 0.75,
        price: extractYGOPrice(raw) ?? undefined,
        verification: {
          status: 'needs_review' as const,
          provider: 'ygoprodeck',
          reasons: ['alternativePrinting'],
        },
      }));
  } catch {
    return [];
  }
}

// ── MAGIC: THE GATHERING ────────────────────────────────────────────────────

async function findMTGCard(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  const result = await fetchMTGCard(id.name, id.set, id.number);
  if (!result) return [];

  const exactPrint = !!(id.set && id.number);
  const conf = exactPrint ? 0.96 : id.number ? 0.88 : 0.76;
  const primary: ScanResult = {
    card: result.card,
    confidence: conf,
    price: result.price ?? undefined,
    verification: {
      status: exactPrint ? 'verified' : 'needs_review',
      provider: 'scryfall',
      reasons: exactPrint ? ['set', 'collectorNumber'] : id.number ? ['collectorNumber'] : ['name'],
    },
  };

  // Fetch other printings as alternatives (Scryfall has all reprints)
  const alts = await fetchMTGAlternatives(id.name, result.card.apiId);
  if (alts.length) return [primary, ...alts];

  return [primary];
}

async function fetchMTGAlternatives(name: string, excludeApiId: string): Promise<ScanResult[]> {
  try {
    const q = `!"${name}"`;
    const r = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=released&dir=desc&unique=prints`,
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.data ?? [])
      .filter((raw: any) => raw.id !== excludeApiId)
      .slice(0, 2)
      .map((raw: any) => ({
        card: scryfallToCard(raw),
        confidence: 0.75,
        price: extractMTGPrice(raw) ?? undefined,
        verification: {
          status: 'needs_review' as const,
          provider: 'scryfall',
          reasons: ['alternativePrinting'],
        },
      }));
  } catch {
    return [];
  }
}

// ── NARUTO ──────────────────────────────────────────────────────────────────

async function findNarutoCard(id: CardIdentification): Promise<ScanResult[]> {
  const results = buildNarutoResult(id);
  if (!results.length) return [];
  const ebay = await enrichWithEbay(results[0].card);
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
  return [{
    card,
    confidence: 0.85,
    verification: {
      status: 'needs_review',
      provider: 'vision',
      reasons: num ? ['printedCode'] : ['name'],
    },
  }];
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
  return [{
    card,
    confidence: 0.82,
    price: ebay.price,
    verification: {
      status: 'needs_review',
      provider: 'vision+ebay',
      reasons: id.number ? ['collectorNumber'] : ['name'],
    },
  }];
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

async function enrichWithEbay(card: Card): Promise<{ price?: import('@/types').CardPrice }> {
  try {
    const validate = { name: card.name, number: card.number };

    const primary = await callEbayLookup(buildEbayQuery(card.name, card.number, card.game), validate);

    let fallback = primary;
    if (!primary?.image && card.name) {
      fallback = await callEbayLookup(buildEbayQuery(card.name, '', card.game), validate);
    }

    const result: { price?: import('@/types').CardPrice } = {};
    const best = (primary?.price?.sampleSize ?? 0) >= (fallback?.price?.sampleSize ?? 0) ? primary : fallback;

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
  const res = await postServerApi<any>('/api/ebay-lookup', { query, validate });
  return res.ok ? res.data : null;
}

// ── GIBL TCG ────────────────────────────────────────────────────────────────

interface GiblIdentity {
  name: string;
  setCode: string;
  number: string;
  printedTotal?: string;
  confidence: number;
  cardType?: string;
  imageUrl?: string;
}

async function identifyWithGibl(base64: string): Promise<GiblIdentity | null> {
  const res = await postServerApi<any>('/api/gibl-scan', { image: base64 });
  if (!res.ok) return null;

  const data = res.data;
  if (!data.found || !data.name) return null;

  return {
    name: data.name as string,
    setCode: (data.setCode as string) ?? '',
    number: (data.number as string) ?? '',
    printedTotal: (data.printedTotal as string) ?? undefined,
    confidence: (data.confidence as number) ?? 0.9,
    cardType: (data.cardType as string) ?? 'pokemon',
    imageUrl: (data.imageUrl as string) ?? undefined,
  };
}

async function findCardByGiblIdentity({
  name,
  setCode,
  number,
  printedTotal,
  confidence,
  cardType,
}: GiblIdentity, supportingId?: CardIdentification | null, sourceImageBase64?: string): Promise<ScanResult[]> {
  // GiblTCG predict-card is only reliable for Pokémon — all other games
  // are handled by Claude Vision via routeByGame.
  if (cardType !== 'pokemon') return [];

  let tcgCard: TCGCard | null = null;
  let conf = confidence;
  const giblId: CardIdentification = {
    game: 'pokemon',
    name,
    number: printedTotal ? `${number}/${printedTotal}` : number,
    printedTotal,
    set: setCode,
  };
  const hasSecondProviderAgreement = pokemonIdentityAgreement(giblId, supportingId);
  const trustedProvider = confidence >= MIN_STRONG_PROVIDER_CONFIDENCE || hasSecondProviderAgreement;

  if (setCode && number) {
    const r = await fetchCardsByQuery(`set.id:${setCode} number:${number}`, 3);
    if (r.length === 1) { tcgCard = r[0]; conf = Math.min(confidence, 0.99); }
  }
  if (!tcgCard) {
    const results = await findCardInApi(giblId, sourceImageBase64);

    const gated = results.map((result) => applyProviderTrustGate(
      {
        ...result,
        confidence: Math.min(result.confidence, confidence || result.confidence),
      },
      trustedProvider,
      confidence,
      hasSecondProviderAgreement,
    ));
    return Promise.all(gated.map((result) => verifyAgainstReferenceImage(result, sourceImageBase64)));
  }

  const result = buildScanResult(tcgCard, conf);
  result.verification = verifyPokemonResult(tcgCard, giblId, 1);
  const fresh = await fetchFreshPrice(tcgCard.id, tcgCard.tcgplayerUrl, tcgCard.rarity);
  if (fresh) result.price = fresh;

  return [await verifyAgainstReferenceImage(
    applyProviderTrustGate(result, trustedProvider, confidence, hasSecondProviderAgreement),
    sourceImageBase64,
  )];
}

function applyProviderTrustGate(
  result: ScanResult,
  trustedProvider: boolean,
  providerConfidence: number,
  hasSecondProviderAgreement: boolean,
): ScanResult {
  const verification = result.verification;
  if (!verification) return result;

  const reasons = new Set(verification.reasons);
  if (hasSecondProviderAgreement) reasons.add('secondProvider');

  if (!trustedProvider && verification.status === 'verified') {
    reasons.add(`vision${Math.round(providerConfidence * 100)}`);
    reasons.add('manualReviewRequired');
    return {
      ...result,
      verification: {
        ...verification,
        status: 'needs_review',
        reasons: Array.from(reasons),
      },
    };
  }

  return {
    ...result,
    verification: { ...verification, reasons: Array.from(reasons) },
  };
}

function pokemonIdentityAgreement(primary: CardIdentification, secondary?: CardIdentification | null): boolean {
  if (!secondary || secondary.game !== 'pokemon' || !secondary.name) return false;

  const primaryNumber = primary.number?.split('/')[0]?.trim();
  const secondaryNumber = secondary.number?.split('/')[0]?.trim();
  const primaryTotal = primary.printedTotal?.trim() ?? primary.number?.split('/')[1]?.trim();
  const secondaryTotal = secondary.printedTotal?.trim() ?? secondary.number?.split('/')[1]?.trim();
  const primarySet = primary.set?.trim();
  const secondarySet = secondary.set?.trim();

  const nameMatches = normalizeText(primary.name) === normalizeText(secondary.name);
  const numberMatches = !!primaryNumber && !!secondaryNumber && primaryNumber === secondaryNumber;
  const totalMatches = !!primaryTotal && !!secondaryTotal && primaryTotal === secondaryTotal;
  const setMatches = !!primarySet && !!secondarySet && normalizeText(primarySet) === normalizeText(secondarySet);

  return nameMatches && (numberMatches || totalMatches || setMatches);
}

function prioritizeScanResults(results: ScanResult[]): ScanResult[] {
  return [...results].sort((a, b) => {
    const aVerified = a.verification?.status === 'verified' ? 1 : 0;
    const bVerified = b.verification?.status === 'verified' ? 1 : 0;
    return bVerified - aVerified || b.confidence - a.confidence;
  });
}

// ── CLAUDE VISION ───────────────────────────────────────────────────────────

async function verifyAgainstReferenceImage(
  result: ScanResult,
  sourceImageBase64?: string,
): Promise<ScanResult> {
  if (!sourceImageBase64 || !result.card.imageUrl) return result;
  if (result.verification?.status === 'verified') return result;

  try {
    const res = await postServerApi<{
      exact: boolean;
      confidence: number;
      reasons?: string[];
      mismatches?: string[];
    }>('/api/visual-verify', {
      image: sourceImageBase64,
      referenceImageUrl: result.card.imageUrl,
      expected: {
        game: result.card.game,
        name: result.card.name,
        setName: result.card.setName,
        setCode: result.card.setCode,
        number: result.card.number,
        rarity: result.card.rarity,
      },
    });

    if (!res.ok || !res.data.exact || res.data.confidence < 0.9) return result;

    const currentReasons = result.verification?.reasons ?? [];
    return {
      ...result,
      confidence: Math.max(result.confidence, Math.min(0.99, res.data.confidence)),
      verification: {
        status: 'verified',
        provider: result.verification?.provider
          ? `${result.verification.provider}+visual`
          : 'visual',
        reasons: [...new Set([...currentReasons, ...(res.data.reasons ?? []), 'referenceImage'])],
      },
    };
  } catch {
    return result;
  }
}

async function identifyWithClaude(base64: string): Promise<CardIdentification | null> {
  try {
    const serverResult = await postServerApi<any>('/api/scan', { image: base64 });
    if (serverResult.ok) {
      const data = serverResult.data;
      if (data.error) return null;
      return data as CardIdentification;
    }

    return null;
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
  try {
    const res = await postServerApi<any>('/api/price', { cardId, tcgplayerUrl, rarity });
    if (!res.ok) return null;
    const d = res.data;
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
