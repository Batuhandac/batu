import { DUPZOR_TILES, YANIS_TILES } from '@/content/tiles';
import leonida from '@/content/data/leonida-locations.json';
import type { MapLocation } from '@/types';

/** World is a 32,768 m square, origin at its centre, Y pointing north. One 1024 px tile covers it at z=0. */
export const WORLD = 32768;
export const HALF = WORLD / 2;
export const TILE_PX = 1024;
export const MAX_Z = 6;

/** Land extent in metres, used for the opening fit. */
export const LAND = { minX: -9800, maxX: 3300, minY: -8400, maxY: 8400 };

export type TileStyle = 'yanis' | 'dupzor';

const RANGES: Record<number, [[number, number], [number, number]]> = {
  0: [[0, 0], [0, 0]], 1: [[0, 0], [1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 1], [4, 5]],
  4: [[0, 2], [9, 11]], 5: [[0, 4], [19, 23]], 6: [[0, 8], [38, 47]],
};

const REMOTE_SET: Record<TileStyle, string> = { yanis: 'yanis,6', dupzor: 'dupzor,51' };
const BUNDLED: Record<TileStyle, Record<string, number>> = { yanis: YANIS_TILES, dupzor: DUPZOR_TILES };
export const BUNDLED_MAX_Z: Record<TileStyle, number> = { yanis: 3, dupzor: 2 };

/**
 * Higher zoom levels stream from a tile host. Default is the open gta6map repo on GitHub
 * (the author allows reuse of the tiles); set EXPO_PUBLIC_TILES_BASE_URL to your own mirror
 * for production traffic.
 */
const TILES_BASE = (process.env.EXPO_PUBLIC_TILES_BASE_URL ?? 'https://raw.githubusercontent.com/gta6map/gta6map.github.io/main/tiles').replace(/\/+$/, '');

export const pxPerMeter = (z: number) => (TILE_PX * Math.pow(2, z)) / WORLD;

export function inRange(z: number, x: number, y: number) {
  const r = RANGES[z];
  if (!r) return false;
  return x >= r[0][0] && x <= r[1][0] && y >= r[0][1] && y <= r[1][1];
}

export function tileSource(style: TileStyle, z: number, x: number, y: number): number | { uri: string } | null {
  if (!inRange(z, x, y)) return null;
  const local = BUNDLED[style][`${z}_${y}_${x}`];
  if (local) return local;
  return { uri: `${TILES_BASE}/${REMOTE_SET[style]}/${z}/${z},${y},${x}.jpg` };
}

const B = leonida.meta.bounds;
/** Percent coordinates (how content is stored) back to world metres. */
export function toWorld(l: Pick<MapLocation, 'x' | 'y'>): { wx: number; wy: number } {
  return { wx: B.x0 + (l.x / 100) * B.side, wy: B.y0 + ((100 - l.y) / 100) * B.side };
}
