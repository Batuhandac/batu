import { create } from 'zustand';
import { ScanResult } from '@/types';
import { scanCardWithVision } from '@/lib/api/cardScanner';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

type ScanPhase = 'idle' | 'scanning' | 'processing' | 'result' | 'error';

interface ScanState {
  phase: ScanPhase;
  results: ScanResult[];
  activeIndex: number;
  error: string | null;
  history: ScanResult[];

  scan: (imageBase64: string, userId: string) => Promise<void>;
  setActiveIndex: (index: number) => void;
  reset: () => void;
  clearError: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  phase: 'idle',
  results: [],
  activeIndex: 0,
  error: null,
  history: [],

  scan: async (imageBase64, userId) => {
    set({ phase: 'scanning', error: null, results: [], activeIndex: 0 });

    try {
      set({ phase: 'processing' });

      const results = await scanCardWithVision(imageBase64);

      if (!results.length) {
        set({ phase: 'error', error: 'Kart tanınamadı. Tekrar deneyin.' });
        return;
      }

      const isGuest = useAuthStore.getState().isGuest;
      if (isSupabaseConfigured && !isGuest) {
        try {
          await supabase.from('scan_history').insert({
            user_id: userId,
            confidence: results[0].confidence,
            raw_response: results,
          });
        } catch {
          // non-critical
        }
      }

      set({
        phase: 'result',
        results,
        activeIndex: 0,
        history: [results[0], ...get().history].slice(0, 50),
      });
    } catch {
      set({ phase: 'error', error: 'Tarama sırasında bir hata oluştu.' });
    }
  },

  setActiveIndex: (index) => set({ activeIndex: index }),

  reset: () => set({ phase: 'idle', results: [], activeIndex: 0, error: null }),

  clearError: () => set({ phase: 'idle', error: null }),
}));
