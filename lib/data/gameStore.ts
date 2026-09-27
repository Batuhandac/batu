// Oyunlaştırma için cihazda tutulan küçük işaretler: ilk yardım rehberine bakıldı mı,
// hangi rozetlerin kutlaması gösterildi, ilk adımlar kartı kapatıldı mı.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'patisos:game';

interface GameFlags {
  firstAidSeen: boolean;
  seenBadges: string[];
  stepsClosed: boolean;
}

const EMPTY: GameFlags = { firstAidSeen: false, seenBadges: [], stepsClosed: false };

export async function loadGameFlags(): Promise<GameFlags> {
  try {
    return { ...EMPTY, ...JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}') };
  } catch {
    return EMPTY;
  }
}

async function patch(p: Partial<GameFlags>) {
  const cur = await loadGameFlags();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...cur, ...p })).catch(() => {});
}

export const markFirstAidSeen = () => patch({ firstAidSeen: true });
export const closeFirstSteps = () => patch({ stepsClosed: true });
export async function markBadgesSeen(ids: string[]) {
  const cur = await loadGameFlags();
  await patch({ seenBadges: Array.from(new Set([...cur.seenBadges, ...ids])) });
}
