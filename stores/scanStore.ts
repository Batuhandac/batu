import { create } from 'zustand';
import { ScanResult } from '@/types';
import { scanCardImage } from '@/lib/api/gibltcg';
import { fetchCardPrice } from '@/lib/api/justtcg';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

type ScanPhase = 'idle' | 'scanning' | 'processing' | 'result' | 'error';

interface ScanState {
  phase: ScanPhase;
  result: ScanResult | null;
  error: string | null;
  history: ScanResult[];

  scan: (imageBase64: string, userId: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  phase: 'idle',
  result: null,
  error: null,
  history: [],

  scan: async (imageBase64, userId) => {
    set({ phase: 'scanning', error: null, result: null });

    try {
      set({ phase: 'processing' });

      const results = await scanCardImage(imageBase64);

      if (!results.length) {
        set({ phase: 'error', error: 'Kart tanınamadı. Tekrar deneyin.' });
        return;
      }

      const top = results[0];

      const price = await fetchCardPrice(top.card.game, top.card.apiId);
      const resultWithPrice: ScanResult = { ...top, price: price ?? undefined };

      const isGuest = useAuthStore.getState().isGuest;
      if (isSupabaseConfigured && !isGuest) {
        try {
          await supabase.from('scan_history').insert({
            user_id: userId,
            confidence: top.confidence,
            raw_response: results,
          });
        } catch {
          // history logging is non-critical
        }
      }

      set({
        phase: 'result',
        result: resultWithPrice,
        history: [resultWithPrice, ...get().history].slice(0, 50),
      });
    } catch (err) {
      set({ phase: 'error', error: 'Tarama sırasında bir hata oluştu.' });
      console.error('Scan error:', err);
    }
  },

  reset: () => {
    set({ phase: 'idle', result: null, error: null });
  },

  clearError: () => {
    set({ phase: 'idle', error: null });
  },
}));
