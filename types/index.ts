export type Game = 'pokemon' | 'yugioh' | 'onepiece' | 'mtg' | 'lorcana';
export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
export type Tier = 'free' | 'premium' | 'pro_starter' | 'pro_growth' | 'pro_enterprise';
export type Currency = 'TRY' | 'USD' | 'EUR';
export type ChannelType = 'ikas' | 'shopify' | 'ebay' | 'trendyol' | 'hepsiburada';
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | 'firstEditionHolofoil'
  | 'firstEditionNormal'
  | 'unlimitedHolofoil';
export type BadgeCategory = 'collection' | 'scan' | 'trade' | 'pokedex' | 'value' | 'social';
export type FriendStatus = 'pending' | 'accepted';

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

export interface MultiSourcePrice {
  tcgplayer?: { low: number; mid: number; high: number; market: number };
  cardmarket?: { low: number; avg: number; trend: number };
  primary: CardPrice;
}

export interface UserCard {
  id: string;
  userId: string;
  card: Card;
  quantity: number;
  condition: Condition;
  foil: boolean;
  variant?: CardVariant;
  notes?: string;
  purchasePrice?: number;
  purchaseCurrency?: Currency;
  acquiredAt: string;
  createdAt: string;
  price?: CardPrice;
  multiPrice?: MultiSourcePrice;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isTradeFolder: boolean;
  isPublic: boolean;
  cardCount?: number;
  totalValue?: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  tier: Tier;
  scanCountMonth: number;
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friend: Profile;
  status: FriendStatus;
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

export interface SetInfo {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  printedTotal?: number;
  game: Game;
  logoUrl?: string;
  symbolUrl?: string;
}

export interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  artist?: string;
  imageSmall: string;
  imageLarge: string;
  tcgplayerUrl?: string;
  prices?: {
    tcgplayer?: Record<string, { low: number; mid: number; high: number; market: number }>;
    cardmarket?: { averageSellPrice: number; lowPrice: number; trendPrice: number };
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  locked: boolean;
  unlockedAt?: string;
  progress?: number;
  progressLabel?: string;
}

export interface DexEntry {
  number: number;
  name: string;
  owned: boolean;
  cardCount: number;
}

export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  totalValueUsd: number;
  valueByGame: Partial<Record<Game, number>>;
  rarityBreakdown: Record<string, number>;
  conditionBreakdown: Record<Condition, number>;
  topCards: UserCard[];
  foilCount: number;
  gamesCount: number;
}

export const CONDITION_LABELS: Record<Condition, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
};

export const VARIANT_LABELS: Record<CardVariant, string> = {
  normal: 'Normal',
  holofoil: 'Holo',
  reverseHolofoil: 'Reverse Holo',
  firstEditionHolofoil: '1st Edition Holo',
  firstEditionNormal: '1st Edition',
  unlimitedHolofoil: 'Unlimited Holo',
};

export const GAME_LABELS: Record<Game, string> = {
  pokemon: 'Pokémon',
  yugioh: 'Yu-Gi-Oh!',
  onepiece: 'One Piece',
  mtg: 'Magic: The Gathering',
  lorcana: 'Lorcana',
};
