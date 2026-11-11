import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SEED_CHEATS, SEED_GUIDES, SEED_LOCATIONS, SEED_MISSIONS, SEED_UPDATES } from '@/content/seed';
import type { Cheat, ContentBundle, ContentUpdate, Guide, MapLocation, Mission } from '@/types';

const CACHE_KEY = 'leonida.content.v1';

export function seedBundle(): ContentBundle {
  return {
    cheats: SEED_CHEATS,
    missions: SEED_MISSIONS,
    guides: SEED_GUIDES,
    locations: SEED_LOCATIONS,
    updates: SEED_UPDATES,
    fetchedAt: new Date(0).toISOString(),
    source: 'seed',
  };
}

export async function readCache(): Promise<ContentBundle | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContentBundle;
    return { ...parsed, source: 'cache' };
  } catch {
    return null;
  }
}

async function writeCache(bundle: ContentBundle) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
  } catch {
    /* cache is best-effort */
  }
}

// Supabase rows use snake_case; map to app types.
type Row = Record<string, unknown>;

const rowToCheat = (r: Row): Cheat => ({
  id: String(r.id), slug: String(r.slug), title: r.title as Cheat['title'],
  category: r.category as Cheat['category'], effect: r.effect as Cheat['effect'],
  codes: (r.codes ?? {}) as Cheat['codes'], status: r.status as Cheat['status'],
  notes: (r.notes ?? undefined) as Cheat['notes'], source: (r.source ?? undefined) as string | undefined,
  verifiedAt: (r.verified_at ?? undefined) as string | undefined, updatedAt: String(r.updated_at),
});
const rowToMission = (r: Row): Mission => ({
  id: String(r.id), slug: String(r.slug), order: Number(r.order_no ?? 0), title: r.title as Mission['title'],
  chapter: r.chapter as Mission['chapter'], protagonist: r.protagonist as Mission['protagonist'],
  summary: r.summary as Mission['summary'], goldRequirements: (r.gold_requirements ?? []) as Mission['goldRequirements'],
  skipTips: (r.skip_tips ?? []) as Mission['skipTips'], tips: (r.tips ?? []) as Mission['tips'],
  status: r.status as Mission['status'], updatedAt: String(r.updated_at),
});
const rowToGuide = (r: Row): Guide => ({
  id: String(r.id), slug: String(r.slug), title: r.title as Guide['title'], category: r.category as Guide['category'],
  summary: r.summary as Guide['summary'], body: (r.body ?? []) as Guide['body'],
  status: r.status as Guide['status'], updatedAt: String(r.updated_at),
});
const rowToLocation = (r: Row): MapLocation => ({
  id: String(r.id), slug: String(r.slug), name: r.name as MapLocation['name'], type: r.type as MapLocation['type'],
  x: Number(r.x), y: Number(r.y), description: r.description as MapLocation['description'],
  status: r.status as MapLocation['status'], updatedAt: String(r.updated_at),
});
const rowToUpdate = (r: Row): ContentUpdate => ({
  id: String(r.id), kind: r.kind as ContentUpdate['kind'], title: r.title as ContentUpdate['title'],
  body: r.body as ContentUpdate['body'], href: (r.href ?? undefined) as string | undefined, createdAt: String(r.created_at),
});

export async function fetchRemote(): Promise<ContentBundle | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [cheats, missions, guides, locations, updates] = await Promise.all([
      supabase.from('cheats').select('*').eq('published', true).order('updated_at', { ascending: false }),
      supabase.from('missions').select('*').eq('published', true).order('order_no', { ascending: true }),
      supabase.from('guides').select('*').eq('published', true).order('updated_at', { ascending: false }),
      supabase.from('locations').select('*').eq('published', true),
      supabase.from('updates').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const results = [cheats, missions, guides, locations, updates];
    if (results.some((r) => r.error)) return null;
    const bundle: ContentBundle = {
      cheats: (cheats.data ?? []).map(rowToCheat),
      missions: (missions.data ?? []).map(rowToMission),
      guides: (guides.data ?? []).map(rowToGuide),
      locations: (locations.data ?? []).map(rowToLocation),
      updates: (updates.data ?? []).map(rowToUpdate),
      fetchedAt: new Date().toISOString(),
      source: 'remote',
    };
    await writeCache(bundle);
    return bundle;
  } catch {
    return null;
  }
}

/** Remote first, then cache, then seed. Never throws. */
export async function loadContent(): Promise<ContentBundle> {
  const remote = await fetchRemote();
  if (remote) return remote;
  const cached = await readCache();
  if (cached) return cached;
  return seedBundle();
}
