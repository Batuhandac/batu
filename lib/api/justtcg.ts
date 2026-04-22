import { CardPrice, Game } from '@/types';
import { fetchCardPrice as pokeFetch, fetchCardsByQuery, extractBestPrice } from './pokemontcg';

const USD_TO_TRY = 38;

export async function fetchCardPrice(game: Game, cardApiId: string): Promise<CardPrice | null> {
  if (game === 'pokemon') return pokeFetch(cardApiId);
  return null;
}

export async function fetchBulkPrices(
  game: Game,
  cardApiIds: string[],
): Promise<Record<string, CardPrice>> {
  if (game !== 'pokemon' || !cardApiIds.length) return {};

  // Batch via OR query — avoids N individual requests
  const chunks: string[][] = [];
  for (let i = 0; i < cardApiIds.length; i += 20) {
    chunks.push(cardApiIds.slice(i, i + 20));
  }

  const result: Record<string, CardPrice> = {};

  await Promise.all(
    chunks.map(async (ids) => {
      const q = ids.map((id) => `id:${id}`).join(' OR ');
      const cards = await fetchCardsByQuery(q, ids.length);
      for (const card of cards) {
        const raw = {
          id: card.id,
          name: card.name,
          supertype: card.supertype,
          set: { id: card.setId, name: card.setName } as any,
          number: card.number,
          rarity: card.rarity,
          images: { small: card.imageSmall, large: card.imageLarge },
          tcgplayer: card.prices?.tcgplayer
            ? { url: card.tcgplayerUrl ?? '', updatedAt: new Date().toISOString(), prices: card.prices.tcgplayer as any }
            : undefined,
          cardmarket: card.prices?.cardmarket
            ? { url: '', updatedAt: new Date().toISOString(), prices: card.prices.cardmarket as any }
            : undefined,
        };
        const price = extractBestPrice(raw);
        if (price) result[card.id] = price;
      }
    }),
  );

  return result;
}

export function usdToTry(usd: number): number {
  return Math.round(usd * USD_TO_TRY);
}
