import { create } from 'zustand';
import { SetInfo, TCGCard } from '@/types';
import { fetchAllSets, fetchSetCards, searchTCGCards } from '@/lib/api/pokemontcg';

interface BrowseState {
  sets: SetInfo[];
  currentSetCards: TCGCard[];
  currentSetTotal: number;
  searchResults: TCGCard[];
  searchTotal: number;
  loading: boolean;
  searchLoading: boolean;
  selectedSetId: string | null;

  loadSets: () => Promise<void>;
  loadSetCards: (setId: string, page?: number) => Promise<void>;
  search: (query: string, page?: number) => Promise<void>;
  clearSearch: () => void;
  clearSet: () => void;
}

export const useBrowseStore = create<BrowseState>((set, get) => ({
  sets: [],
  currentSetCards: [],
  currentSetTotal: 0,
  searchResults: [],
  searchTotal: 0,
  loading: false,
  searchLoading: false,
  selectedSetId: null,

  loadSets: async () => {
    if (get().sets.length > 0) return;
    set({ loading: true });
    const sets = await fetchAllSets();
    set({ sets, loading: false });
  },

  loadSetCards: async (setId, page = 1) => {
    if (get().selectedSetId !== setId) {
      set({ currentSetCards: [], currentSetTotal: 0, selectedSetId: setId });
    }
    set({ loading: true });
    const { cards, total } = await fetchSetCards(setId, page);
    set((state) => ({
      currentSetCards: page === 1 ? cards : [...state.currentSetCards, ...cards],
      currentSetTotal: total,
      loading: false,
    }));
  },

  search: async (query, page = 1) => {
    if (!query.trim()) {
      set({ searchResults: [], searchTotal: 0 });
      return;
    }
    set({ searchLoading: true });
    const { cards, total } = await searchTCGCards(query, page);
    set((state) => ({
      searchResults: page === 1 ? cards : [...state.searchResults, ...cards],
      searchTotal: total,
      searchLoading: false,
    }));
  },

  clearSearch: () => set({ searchResults: [], searchTotal: 0 }),
  clearSet: () => set({ currentSetCards: [], currentSetTotal: 0, selectedSetId: null }),
}));
