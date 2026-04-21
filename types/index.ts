export type Game = 'pokemon' | 'yugioh' | 'onepiece' | 'mtg' | 'lorcana';
export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
export type Tier = 'free' | 'premium' | 'pro_starter' | 'pro_growth' | 'pro_enterprise';
export type Currency = 'TRY' | 'USD' | 'EUR';
export type ChannelType = 'ikas' | 'shopify' | 'ebay' | 'trendyol' | 'hepsiburada';

export interface Card {
  id: string;
  game: Game;
  apiId: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: string;
  imageUrl: string;
  supertype?: string;
  subtypes?: string[];
  hp?: number;
  artist?: string;
}

export interface CardPrice {
  cardId: string;
  source: string;
  low: number;
  mid: number;
  high: number;
  market?: number;
  currency: Currency;
  cachedAt: string;
}

export interface UserCard {
  id: string;
  userId: string;
  card: Card;
  quantity: number;
  condition: Condition;
  foil: boolean;
  notes?: string;
  purchasePrice?: number;
  purchaseCurrency?: Currency;
  acquiredAt: string;
  createdAt: string;
  price?: CardPrice;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isTradeFolder: boolean;
  isPublic: boolean;
  cardCount?: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  scanCountMonth: number;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friend: Profile;
  status: 'pending' | 'accepted';
  createdAt: string;
}

export interface ScanResult {
  card: Card;
  confidence: number;
  price?: CardPrice;
}

export interface TradeSetup {
  goalExpansion?: string;
  goalFolder?: Folder;
  friendId?: string;
  scopeFolderId?: string;
}

export interface ChannelConfig {
  id: string;
  userId: string;
  type: ChannelType;
  name: string;
  accessToken: string;
  storeUrl?: string;
  isActive: boolean;
  lastSyncAt?: string;
}

export interface ListingPush {
  userCardId: string;
  channels: ChannelType[];
  price: number;
  currency: Currency;
  title?: string;
  description?: string;
}

export const CONDITION_LABELS: Record<Condition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
};

export const GAME_LABELS: Record<Game, string> = {
  pokemon: 'Pokémon',
  yugioh: 'Yu-Gi-Oh!',
  onepiece: 'One Piece',
  mtg: 'Magic: The Gathering',
  lorcana: 'Lorcana',
};
