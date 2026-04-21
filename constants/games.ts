import { Game } from '@/types';
import { colors } from './theme';

export const GAME_CONFIG: Record<Game, { label: string; color: string; sets: string[] }> = {
  pokemon: {
    label: 'Pokémon',
    color: colors.pokemon,
    sets: [
      'Surging Sparks',
      'Stellar Crown',
      'Shrouded Fable',
      'Twilight Masquerade',
      'Temporal Forces',
      'Paldean Fates',
      'Paradox Rift',
      'Obsidian Flames',
    ],
  },
  yugioh: {
    label: 'Yu-Gi-Oh!',
    color: colors.yugioh,
    sets: [
      'Rage of the Abyss',
      'Legacy of Destruction',
      'Phantom Nightmare',
      'Invasion of Chaos',
      'Age of Overlord',
      'Photon Hypernova',
    ],
  },
  onepiece: {
    label: 'One Piece',
    color: colors.onepiece,
    sets: [
      'OP-09',
      'OP-08',
      'OP-07',
      'OP-06',
      'OP-05',
      'OP-04',
      'OP-03',
      'OP-02',
      'OP-01',
    ],
  },
  mtg: {
    label: 'Magic: The Gathering',
    color: colors.mtg,
    sets: [
      'Aetherdrift',
      'Duskmourn',
      'Bloomburrow',
      'Modern Horizons 3',
      'Outlaws of Thunder Junction',
      'Murders at Karlov Manor',
    ],
  },
  lorcana: {
    label: 'Lorcana',
    color: colors.lorcana,
    sets: [
      'Archazia\'s Island',
      'Shimmering Skies',
      'Ursula\'s Return',
      'Into the Inklands',
      'Rise of the Floodborn',
      'The First Chapter',
    ],
  },
};

export const FREE_SCAN_LIMIT = 25;
export const PREMIUM_SCAN_LIMIT = Infinity;
