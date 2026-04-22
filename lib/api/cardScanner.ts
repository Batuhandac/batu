import { ScanResult } from '@/types';
import { searchTCGCards, fetchSetCards, rawToTCGCard, extractBestPrice, tcgCardToCard } from './pokemontcg';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

interface CardIdentification {
  name: string;
  number?: string;
  set?: string;
  game: 'pokemon' | 'yugioh' | 'mtg' | 'other';
}

export async function scanCardWithVision(base64: string): Promise<ScanResult[]> {
  if (!ANTHROPIC_KEY) return [];

  const identification = await identifyWithClaude(base64);
  if (!identification || identification.game !== 'pokemon') return [];

  return findCardInApi(identification);
}

async function identifyWithClaude(base64: string): Promise<CardIdentification | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
              },
              {
                type: 'text',
                text: `Identify this TCG card. Reply with ONLY a JSON object, no other text:
{"name": "exact card name as printed", "number": "card number like 4/102", "set": "set name", "game": "pokemon"}
If not a recognizable TCG card, reply: {"game": "other", "name": ""}`,
              },
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

async function findCardInApi(id: CardIdentification): Promise<ScanResult[]> {
  if (!id.name) return [];

  try {
    const { cards } = await searchTCGCards(id.name);
    if (!cards.length) return [];

    // Try to find exact match by number
    let best = cards[0];
    if (id.number) {
      const num = id.number.split('/')[0];
      const exact = cards.find((c) => c.number === num || c.number === id.number);
      if (exact) best = exact;
    }

    // Build ScanResult with real price
    const card = tcgCardToCard(best);
    const rawPrice = extractBestPrice({
      id: best.id,
      name: best.name,
      supertype: best.supertype,
      set: { id: best.setId, name: best.setName } as any,
      number: best.number,
      rarity: best.rarity,
      images: { small: best.imageSmall, large: best.imageLarge },
      tcgplayer: best.prices?.tcgplayer
        ? { url: '', updatedAt: new Date().toISOString(), prices: best.prices.tcgplayer as any }
        : undefined,
      cardmarket: best.prices?.cardmarket
        ? { url: '', updatedAt: new Date().toISOString(), prices: best.prices.cardmarket as any }
        : undefined,
    });

    return [
      {
        confidence: 0.95,
        card,
        price: rawPrice ?? undefined,
      },
    ];
  } catch {
    return [];
  }
}
