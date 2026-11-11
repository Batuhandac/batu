import { create } from 'zustand';
import { loadContent, seedBundle } from '@/lib/content';
import type { ContentBundle } from '@/types';

interface ContentState {
  bundle: ContentBundle;
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
}

export const useContent = create<ContentState>((set, get) => ({
  bundle: seedBundle(),
  loading: false,
  loaded: false,
  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    const bundle = await loadContent();
    set({ bundle, loading: false, loaded: true });
  },
}));
