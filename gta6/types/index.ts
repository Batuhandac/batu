export type Lang = 'tr' | 'en';
export type Localized = { tr: string; en: string };

/** Every piece of content carries an honesty flag. Nothing is shown as fact unless verified. */
export type ContentStatus = 'verified' | 'unverified' | 'rumor' | 'debunked';

export type GamePlatform = 'ps5' | 'xbox' | 'pc';

export type CheatCategory = 'player' | 'weapon' | 'vehicle' | 'world' | 'misc';

export interface Cheat {
  id: string;
  slug: string;
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
  title: Localized;
  category: GuideCategory;
  summary: Localized;
  /** Paragraphs. Plain text, no markdown. */
  body: Localized[];
  status: ContentStatus;
  updatedAt: string;
}

export type LocationType = 'region' | 'city' | 'landmark' | 'collectible' | 'shop';

export interface MapLocation {
  id: string;
  slug: string;
  name: Localized;
  type: LocationType;
  /** Percent coordinates on our own hand-drawn map, 0-100. */
  x: number;
  y: number;
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

export interface ContentBundle {
  cheats: Cheat[];
  missions: Mission[];
  guides: Guide[];
  locations: MapLocation[];
  updates: ContentUpdate[];
  fetchedAt: string;
  source: 'seed' | 'cache' | 'remote';
}
