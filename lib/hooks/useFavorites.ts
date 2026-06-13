import { useState, useCallback } from 'react';
import {
  loadFavorites,
  toggleFavorite,
  setPrimaryVetFavorite,
} from '@/lib/data/localStore';
import { track } from '@/lib/analytics';
import type { Favorite } from '@/types';

// Favoriler artık cihazda (AsyncStorage) saklanır — giriş/backend gerektirmez.
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const load = useCallback(async () => {
    setFavorites(await loadFavorites());
  }, []);

  const toggle = useCallback(async (clinicId: string) => {
    const next = await toggleFavorite(clinicId);
    setFavorites(next);
    if (next.some((f) => f.clinic_id === clinicId)) {
      await track('favorite_added', { clinic_id: clinicId });
    }
  }, []);

  const setPrimaryVet = useCallback(async (clinicId: string) => {
    setFavorites(await setPrimaryVetFavorite(clinicId));
  }, []);

  const isFav = useCallback(
    (clinicId: string) => favorites.some((f) => f.clinic_id === clinicId),
    [favorites]
  );
  const isPrimaryVet = useCallback(
    (clinicId: string) =>
      favorites.find((f) => f.clinic_id === clinicId)?.is_primary_vet ?? false,
    [favorites]
  );

  return { favorites, load, toggle, setPrimaryVet, isFav, isPrimaryVet };
}
