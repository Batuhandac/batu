import { useState, useCallback } from 'react';
import {
  loadPets,
  upsertPet,
  removePet,
  setPrimaryPet,
} from '@/lib/data/localStore';
import type { Pet } from '@/types';

// Petler artık cihazda (AsyncStorage) saklanır — giriş/backend gerektirmez.
export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPets(await loadPets());
    setLoading(false);
  }, []);

  const upsert = useCallback(
    async (pet: Partial<Pet> & { name: string }) => {
      const saved = await upsertPet(pet);
      setPets(await loadPets());
      return saved;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await removePet(id);
    setPets(await loadPets());
  }, []);

  const setPrimary = useCallback(async (id: string) => {
    await setPrimaryPet(id);
    setPets(await loadPets());
  }, []);

  return { pets, loading, load, upsert, remove, setPrimary };
}
