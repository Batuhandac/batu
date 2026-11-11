export type Lang = 'tr' | 'en';
export type Localized = { tr: string; en: string };

/** Every piece of content carries an honesty flag. Nothing is shown as fact unless verified. */
export type ContentStatus = 'verified' | 'unverified' | 'rumor' | 'debunked';

export type GamePlatform = 'ps5' | 'xbox' | 'pc';

/** Which game a record belongs to. GTA V content is real and verified today; GTA VI fills in from launch. */
export type Game = 'gta6' | 'gta5';

export type CheatCategory = 'player' | 'weapon' | 'vehicle' | 'world' | 'misc';

export interface Cheat {
  id: string;
  slug: string;
  game: Game;
  title: Localized;
  category: CheatCategory;
  effect: Localized;
  codes: Partial<Record<GamePlatform | 'phone', string>>;
  status: ContentStatus;
  notes?: Localized;
  source?: string;
  verifiedAt?: string;
  updatedAt: string;
}

export type Protagonist = 'jason' | 'lucia' | 'both' | 'unknown';

export interface Mission {
  id: string;
  slug: string;
  game: Game;
  order: number;
  title: Localized;
  chapter: Localized;
  protagonist: Protagonist;
  summary: Localized;
  goldRequirements: Localized[];
  skipTips: Localized[];
  tips: Localized[];
  status: ContentStatus;
  updatedAt: string;
}

export type GuideCategory = 'money' | 'weapons' | 'vehicles' | 'side' | 'tricks' | 'launch';

export interface Guide {
  id: string;
  slug: string;
  game: Game;
  title: Localized;
  category: GuideCategory;
  summary: Localized;
  /** Paragraphs. Plain text, no markdown. */
  body: Localized[];
  status: ContentStatus;
  updatedAt: string;
}

export type LocationType =
  | 'region' | 'city' | 'landmark' | 'collectible' | 'shop'
  | 'transport' | 'other' | 'commercial' | 'industrial' | 'infrastructure' | 'leisure'
  | 'government' | 'residential' | 'hotel' | 'nature' | 'restaurant' | 'entertainment' | 'public' | 'safehouse' | 'service';

export interface MapLocation {
  id: string;
  slug: string;
  name: Localized;
  type: LocationType;
  /** Percent coordinates on our map plane, 0-100 (derived from community game-space coordinates). */
  x: number;
  y: number;
  /** Area / district name as the community catalogue reports it. */
  area?: string;
  description: Localized;
  status: ContentStatus;
  updatedAt: string;
}

export type UpdateKind = 'cheat' | 'mission' | 'guide' | 'map' | 'news';

export interface ContentUpdate {
  id: string;
  kind: UpdateKind;
  title: Localized;
  body: Localized;
  /** Optional deep link target, e.g. /cheat/invincibility */
  href?: string;
  createdAt: string;
}

export interface GlossaryTerm {
  id: string;
  term: Localized;
  definition: Localized;
  category: 'ui' | 'gameplay' | 'police' | 'economy' | 'missions';
}

export interface ContentBundle {
  cheats: Cheat[];
  missions: Mission[];
  guides: Guide[];
  locations: MapLocation[];
  updates: ContentUpdate[];
  fetchedAt: string;
  source: 'seed' | 'cache' | 'remote';
}
