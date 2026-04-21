import { create } from 'zustand';
import { CollectionStats, Condition, Game } from '@/types';

interface StatsState {
  stats: CollectionStats | null;
  compute: (
    cards: {
      card: { game: Game; rarity: string };
      quantity: number;
      condition: Condition;
      foil: boolean;
      price?: { mid: number };
    }[],
    totalValueUsd: number,
  ) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,

  compute: (cards, totalValueUsd) => {
    const valueByGame: Partial<Record<Game, number>> = {};
    const rarityBreakdown: Record<string, number> = {};
    const conditionBreakdown: Record<Condition, number> = { NM: 0, LP: 0, MP: 0, HP: 0, DMG: 0 };
    let foilCount = 0;
    const games = new Set<Game>();

    for (const uc of cards) {
      const game = uc.card.game;
      games.add(game);
      const val = (uc.price?.mid ?? 0) * uc.quantity;
      valueByGame[game] = (valueByGame[game] ?? 0) + val;

      const rarity = uc.card.rarity || 'Unknown';
      rarityBreakdown[rarity] = (rarityBreakdown[rarity] ?? 0) + uc.quantity;

      conditionBreakdown[uc.condition] = (conditionBreakdown[uc.condition] ?? 0) + uc.quantity;

      if (uc.foil) foilCount += uc.quantity;
    }

    const sortedByValue = [...cards].sort(
      (a, b) => (b.price?.mid ?? 0) * b.quantity - (a.price?.mid ?? 0) * a.quantity,
    );

    set({
      stats: {
        totalCards: cards.reduce((s, c) => s + c.quantity, 0),
        uniqueCards: cards.length,
        totalValueUsd,
        valueByGame,
        rarityBreakdown,
        conditionBreakdown,
        topCards: sortedByValue.slice(0, 10) as any,
        foilCount,
        gamesCount: games.size,
      },
    });
  },
}));
