import { Platform } from 'react-native';
import { ScanResult } from '@/types';
import { fetchCardsByQuery, extractBestPrice, tcgCardToCard } from './pokemontcg';
import type { TCGCard } from '@/types';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

interface CardIdentification {
  name: string;
  hp?: string;
  number?: string;
  set?: string;
  era?: 'wizards' | 'modern' | string;
  features?: string;
  game: 'pokemon' | 'yugioh' | 'mtg' | 'other';
}

const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image.

Extract EXACTLY these fields from what you see on the card:
- "name": the card name printed at the top next to HP. DO NOT include "Basic Pokémon", "Stage 1", or evolution labels. For example if the card shows "Basic Pokémon Charmander", the name is "Charmander". If it shows "Ash's Pikachu" as the title, that full text is the name.
- "hp": the HP number shown next to the name (e.g., "40", "170"). Just the number.
- "number": the small card number printed at the bottom, usually bottom-right corner (e.g., "87/130", "4/102", "234/182"). Include the slash if visible.
- "set": the set name if printed on the card or indicated by a visible symbol (leave empty if uncertain).
- "era": "wizards" if you see "©Wizards of the Coast" or copyright dates 1995-2003. "modern" for newer cards (2004+).
- "features": any of these if visible, comma-separated: "ex", "GX", "V", "VMAX", "VSTAR", "Full Art", "Secret Rare", "Promo", "Shiny", "Holo", "Reverse Holo", "1st Edition".
- "game": "pokemon" for Pokémon TCG, "yugioh" for Yu-Gi-Oh!, "mtg" for Magic: The Gathering, "other" otherwise.

Reply with ONLY a JSON object. No prose, no markdown, no code fences:
{"name":"...","hp":"...","number":"...","set":"...","era":"...","features":"...","game":"pokemon"}

If image is not a TCG card at all, reply: {"name":"","game":"other"}`;

function cleanBase64(raw: string): string {
  const idx = raw.indexOf(',');
  return idx !== -1 ? raw.slice(idx + 1) : raw;
}

export async function scanCardWithVision(base64: string): Promise<ScanResult[]> {
  const clean = cleanBase64(base64);
  const identification = await identifyWithClaude(clean);
  if (!identification || !identification.name || identification.game === 'other') return [];
  return findCardInApi(identification);
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
    return [buildScanResult(best, results.length === 1 ? 0.97 : 0.9)];
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
      ? { url: '', updatedAt: new Date().toISOString(), prices: tcgCard.prices.tcgplayer as any }
      : undefined,
    cardmarket: tcgCard.prices?.cardmarket
      ? { url: '', updatedAt: new Date().toISOString(), prices: tcgCard.prices.cardmarket as any }
      : undefined,
  });

  return { confidence, card, price: rawPrice ?? undefined };
}
