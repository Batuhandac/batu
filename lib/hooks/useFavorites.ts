import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import type { Favorite } from '@/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('favorites').select('*');
    setFavorites((data ?? []) as Favorite[]);
  }, []);

  const toggle = useCallback(async (clinicId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = favorites.find(f => f.clinic_id === clinicId);
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      setFavorites(f => f.filter(x => x.clinic_id !== clinicId));
    } else {
      const { data } = await supabase.from('favorites').insert({ user_id: user.id, clinic_id: clinicId }).select().single();
      if (data) { setFavorites(f => [...f, data as Favorite]); await track('favorite_added', { clinic_id: clinicId }); }
    }
  }, [favorites]);

  const setPrimaryVet = useCallback(async (clinicId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('favorites').update({ is_primary_vet: false }).eq('user_id', user.id);
    await supabase.from('favorites').update({ is_primary_vet: true }).eq('clinic_id', clinicId).eq('user_id', user.id);
    await load();
  }, [load]);

  const isFav = useCallback((clinicId: string) => favorites.some(f => f.clinic_id === clinicId), [favorites]);
  const isPrimaryVet = useCallback((clinicId: string) => favorites.find(f => f.clinic_id === clinicId)?.is_primary_vet ?? false, [favorites]);

  return { favorites, load, toggle, setPrimaryVet, isFav, isPrimaryVet };
}
