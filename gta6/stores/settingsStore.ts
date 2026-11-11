import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Game, GamePlatform, Lang } from '@/types';

const KEY = 'leonida.settings.v1';

interface Persisted {
  lang: Lang;
  game: Game;
  platform: GamePlatform | null;
  pushToken: string | null;
  pushEnabled: boolean;
}

interface SettingsState extends Persisted {
  hydrated: boolean;
  setLang: (lang: Lang) => void;
  setGame: (game: Game) => void;
  setPlatform: (p: GamePlatform | null) => void;
  setPush: (enabled: boolean, token: string | null) => void;
}

const pick = (s: SettingsState): Persisted => ({ lang: s.lang, game: s.game, platform: s.platform, pushToken: s.pushToken, pushEnabled: s.pushEnabled });

async function save(s: SettingsState) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(pick(s)));
  } catch {
    /* best effort */
  }
}

// Manual persistence: zustand/middleware's persist ships an .mjs with import.meta that Metro's web bundle cannot run.
export const useSettings = create<SettingsState>((set, get) => ({
  lang: 'tr',
  game: 'gta6',
  platform: null,
  pushToken: null,
  pushEnabled: false,
  hydrated: false,
  setLang: (lang) => { set({ lang }); save(get()); },
  setGame: (game) => { set({ game }); save(get()); },
  setPlatform: (platform) => { set({ platform }); save(get()); },
  setPush: (pushEnabled, pushToken) => { set({ pushEnabled, pushToken }); save(get()); },
}));

export async function hydrateSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      useSettings.setState({
        lang: p.lang === 'en' || p.lang === 'tr' ? p.lang : 'tr',
        game: p.game === 'gta5' ? 'gta5' : 'gta6',
        platform: p.platform ?? null,
        pushToken: p.pushToken ?? null,
        pushEnabled: !!p.pushEnabled,
      });
    }
  } catch {
    /* fall back to defaults */
  } finally {
    useSettings.setState({ hydrated: true });
  }
}
