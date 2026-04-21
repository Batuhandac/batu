import { create } from 'zustand';
import { Badge, BadgeCategory } from '@/types';
import { ALL_POKEMON } from '@/constants/pokemon';

const BADGE_DEFS: Omit<Badge, 'locked' | 'unlockedAt' | 'progress' | 'progressLabel'>[] = [
  { id: 'first_card', name: 'İlk Adım', description: 'Koleksiyonuna ilk kartı ekle.', emoji: '🃏', category: 'collection' },
  { id: 'first_scan', name: 'İlk Tarama', description: 'Kameranla ilk kartını tara.', emoji: '📷', category: 'scan' },
  { id: 'collector_10', name: 'Koleksiyoner', description: '10 kart ekle.', emoji: '📦', category: 'collection' },
  { id: 'collector_50', name: 'Büyük Koleksiyoner', description: '50 kart ekle.', emoji: '🏆', category: 'collection' },
  { id: 'collector_100', name: 'Pro Koleksiyoner', description: '100 kart ekle.', emoji: '💎', category: 'collection' },
  { id: 'collector_500', name: 'Efsane Koleksiyoner', description: '500 kart ekle.', emoji: '👑', category: 'collection' },
  { id: 'foil_5', name: 'Foil Avcısı', description: '5 foil kart ekle.', emoji: '✨', category: 'collection' },
  { id: 'foil_25', name: 'Foil Ustası', description: '25 foil kart ekle.', emoji: '🌟', category: 'collection' },
  { id: 'value_1k', name: 'Değer Başlangıcı', description: 'Koleksiyonun ₺1.000 değere ulaşsın.', emoji: '💰', category: 'value' },
  { id: 'value_10k', name: 'Değerli Koleksiyoner', description: 'Koleksiyonun ₺10.000 değere ulaşsın.', emoji: '💵', category: 'value' },
  { id: 'value_100k', name: 'Yatırımcı', description: 'Koleksiyonun ₺100.000 değere ulaşsın.', emoji: '🤑', category: 'value' },
  { id: 'multi_game_2', name: 'Multi-Oyuncu', description: '2 farklı oyundan kart ekle.', emoji: '🎮', category: 'collection' },
  { id: 'multi_game_3', name: 'Koleksiyon Ustası', description: '3+ farklı oyundan kart ekle.', emoji: '🎯', category: 'collection' },
  { id: 'trade_folder', name: 'Takas Ustası', description: 'İlk takas klasörünü oluştur.', emoji: '🔄', category: 'trade' },
  { id: 'dex_10', name: 'Pokémon Başlangıcı', description: '10 farklı Pokémon yakala.', emoji: '🎯', category: 'pokedex' },
  { id: 'dex_50', name: 'Pokémon Avcısı', description: '50 farklı Pokémon yakala.', emoji: '🏅', category: 'pokedex' },
  { id: 'dex_100', name: 'Pokémon Uzmanı', description: '100 farklı Pokémon yakala.', emoji: '🌟', category: 'pokedex' },
  { id: 'dex_151', name: 'Orijinal 151', description: 'Tüm Gen 1 Pokémon\'ları yakala.', emoji: '👑', category: 'pokedex' },
  { id: 'dex_251', name: 'Johto Ustası', description: 'Tüm Gen 1+2 Pokémon\'ları yakala.', emoji: '🏆', category: 'pokedex' },
  { id: 'high_value_card', name: 'Paha Biçilmez', description: 'Değeri $50+ olan bir karta sahip ol.', emoji: '💎', category: 'value' },
];

function getDexCount(cards: { card: { name: string } }[]): number {
  const collected = new Set<string>();
  for (const uc of cards) {
    for (const p of ALL_POKEMON) {
      if (uc.card.name.toLowerCase().includes(p.name.toLowerCase())) {
        collected.add(p.name);
      }
    }
  }
  return collected.size;
}

interface BadgeState {
  badges: Badge[];
  unlockedCount: number;
  compute: (cards: { card: { name: string; game: string }; quantity: number; foil: boolean; price?: { mid: number } }[], folders: { isTradeFolder: boolean }[], totalValueUsd: number) => void;
}

const USD_TO_TRY = 40;

export const useBadgeStore = create<BadgeState>((set) => ({
  badges: BADGE_DEFS.map((b) => ({ ...b, locked: true })),
  unlockedCount: 0,

  compute: (cards, folders, totalValueUsd) => {
    const totalCards = cards.reduce((s, c) => s + c.quantity, 0);
    const foilCards = cards.filter((c) => c.foil).length;
    const games = new Set(cards.map((c) => c.card.game)).size;
    const hasTradeFolder = folders.some((f) => f.isTradeFolder);
    const totalTry = totalValueUsd * USD_TO_TRY;
    const dexCount = getDexCount(cards);
    const topCardValue = Math.max(...cards.map((c) => c.price?.mid ?? 0), 0);

    const updated = BADGE_DEFS.map((def) => {
      let locked = true;
      let progress: number | undefined;
      let progressLabel: string | undefined;

      switch (def.id) {
        case 'first_card':
          locked = totalCards === 0;
          break;
        case 'first_scan':
          locked = totalCards === 0;
          break;
        case 'collector_10':
          locked = totalCards < 10;
          progress = Math.min(totalCards / 10, 1);
          progressLabel = `${totalCards}/10`;
          break;
        case 'collector_50':
          locked = totalCards < 50;
          progress = Math.min(totalCards / 50, 1);
          progressLabel = `${totalCards}/50`;
          break;
        case 'collector_100':
          locked = totalCards < 100;
          progress = Math.min(totalCards / 100, 1);
          progressLabel = `${totalCards}/100`;
          break;
        case 'collector_500':
          locked = totalCards < 500;
          progress = Math.min(totalCards / 500, 1);
          progressLabel = `${totalCards}/500`;
          break;
        case 'foil_5':
          locked = foilCards < 5;
          progress = Math.min(foilCards / 5, 1);
          progressLabel = `${foilCards}/5`;
          break;
        case 'foil_25':
          locked = foilCards < 25;
          progress = Math.min(foilCards / 25, 1);
          progressLabel = `${foilCards}/25`;
          break;
        case 'value_1k':
          locked = totalTry < 1000;
          progress = Math.min(totalTry / 1000, 1);
          progressLabel = `₺${Math.round(totalTry).toLocaleString()}/₺1.000`;
          break;
        case 'value_10k':
          locked = totalTry < 10000;
          progress = Math.min(totalTry / 10000, 1);
          progressLabel = `₺${Math.round(totalTry).toLocaleString()}/₺10.000`;
          break;
        case 'value_100k':
          locked = totalTry < 100000;
          progress = Math.min(totalTry / 100000, 1);
          progressLabel = `₺${Math.round(totalTry).toLocaleString()}/₺100.000`;
          break;
        case 'multi_game_2':
          locked = games < 2;
          progress = Math.min(games / 2, 1);
          progressLabel = `${games}/2 oyun`;
          break;
        case 'multi_game_3':
          locked = games < 3;
          progress = Math.min(games / 3, 1);
          progressLabel = `${games}/3 oyun`;
          break;
        case 'trade_folder':
          locked = !hasTradeFolder;
          break;
        case 'dex_10':
          locked = dexCount < 10;
          progress = Math.min(dexCount / 10, 1);
          progressLabel = `${dexCount}/10`;
          break;
        case 'dex_50':
          locked = dexCount < 50;
          progress = Math.min(dexCount / 50, 1);
          progressLabel = `${dexCount}/50`;
          break;
        case 'dex_100':
          locked = dexCount < 100;
          progress = Math.min(dexCount / 100, 1);
          progressLabel = `${dexCount}/100`;
          break;
        case 'dex_151':
          locked = dexCount < 151;
          progress = Math.min(dexCount / 151, 1);
          progressLabel = `${dexCount}/151`;
          break;
        case 'dex_251':
          locked = dexCount < 251;
          progress = Math.min(dexCount / 251, 1);
          progressLabel = `${dexCount}/251`;
          break;
        case 'high_value_card':
          locked = topCardValue < 50;
          progress = Math.min(topCardValue / 50, 1);
          progressLabel = `$${topCardValue.toFixed(2)}/$50`;
          break;
      }

      return {
        ...def,
        locked,
        progress,
        progressLabel,
        unlockedAt: !locked ? new Date().toISOString() : undefined,
      };
    });

    set({ badges: updated, unlockedCount: updated.filter((b) => !b.locked).length });
  },
}));

export const BADGE_CATEGORIES: { key: BadgeCategory; label: string; emoji: string }[] = [
  { key: 'collection', label: 'Koleksiyon', emoji: '🗂' },
  { key: 'scan', label: 'Tarama', emoji: '📷' },
  { key: 'value', label: 'Değer', emoji: '💰' },
  { key: 'trade', label: 'Takas', emoji: '🔄' },
  { key: 'pokedex', label: 'Pokédex', emoji: '🎯' },
  { key: 'social', label: 'Sosyal', emoji: '👥' },
];
