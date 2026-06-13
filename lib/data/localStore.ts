// Yerel (cihaz içi) kalıcı depolama — pets ve favorites için Supabase yerine
// AsyncStorage kullanır. Backend/giriş gerektirmez, tamamen ücretsiz çalışır.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pet, Favorite } from '@/types';

const PETS_KEY = 'patisos:pets';
const FAVS_KEY = 'patisos:favorites';

export function genId(): string {
  return 'loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// ─── Pets ────────────────────────────────────────────────────────────────────
export async function loadPets(): Promise<Pet[]> {
  const raw = await AsyncStorage.getItem(PETS_KEY);
  const pets: Pet[] = raw ? JSON.parse(raw) : [];
  return pets.sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.created_at ?? '').localeCompare(b.created_at ?? '');
  });
}

async function savePets(pets: Pet[]): Promise<void> {
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
}

export async function getPet(id: string): Promise<Pet | null> {
  const pets = await loadPets();
  return pets.find((p) => p.id === id) ?? null;
}

export async function upsertPet(pet: Partial<Pet> & { name: string }): Promise<Pet> {
  const pets = await loadPets();
  const now = new Date().toISOString();
  if (pet.id) {
    const idx = pets.findIndex((p) => p.id === pet.id);
    if (idx >= 0) {
      pets[idx] = { ...pets[idx], ...pet, updated_at: now } as Pet;
      await savePets(pets);
      return pets[idx];
    }
  }
  const newPet: Pet = {
    id: genId(),
    user_id: 'local',
    name: pet.name,
    species: pet.species ?? null,
    breed: pet.breed ?? null,
    age_years: pet.age_years ?? null,
    weight_kg: pet.weight_kg ?? null,
    allergies: pet.allergies ?? null,
    chronic_conditions: pet.chronic_conditions ?? null,
    medications: pet.medications ?? null,
    last_vaccine_date: pet.last_vaccine_date ?? null,
    last_parasite_date: pet.last_parasite_date ?? null,
    emergency_note: pet.emergency_note ?? null,
    owner_name: pet.owner_name ?? null,
    owner_phone: pet.owner_phone ?? null,
    is_primary: pets.length === 0 ? true : (pet.is_primary ?? false), // ilk pet otomatik ana
    created_at: now,
    updated_at: now,
  };
  await savePets([...pets, newPet]);
  return newPet;
}

export async function removePet(id: string): Promise<void> {
  const pets = await loadPets();
  await savePets(pets.filter((p) => p.id !== id));
}

export async function setPrimaryPet(id: string): Promise<void> {
  const pets = await loadPets();
  await savePets(pets.map((p) => ({ ...p, is_primary: p.id === id })));
}

// ─── Favorites ───────────────────────────────────────────────────────────────
export async function loadFavorites(): Promise<Favorite[]> {
  const raw = await AsyncStorage.getItem(FAVS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveFavorites(favs: Favorite[]): Promise<void> {
  await AsyncStorage.setItem(FAVS_KEY, JSON.stringify(favs));
}

export async function toggleFavorite(clinicId: string): Promise<Favorite[]> {
  const favs = await loadFavorites();
  const existing = favs.find((f) => f.clinic_id === clinicId);
  let next: Favorite[];
  if (existing) {
    next = favs.filter((f) => f.clinic_id !== clinicId);
  } else {
    next = [
      ...favs,
      {
        id: genId(),
        user_id: 'local',
        clinic_id: clinicId,
        is_primary_vet: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
  await saveFavorites(next);
  return next;
}

export async function setPrimaryVetFavorite(clinicId: string): Promise<Favorite[]> {
  let favs = await loadFavorites();
  // Favori değilse önce ekle
  if (!favs.some((f) => f.clinic_id === clinicId)) {
    favs = [
      ...favs,
      {
        id: genId(),
        user_id: 'local',
        clinic_id: clinicId,
        is_primary_vet: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
  const next = favs.map((f) => ({ ...f, is_primary_vet: f.clinic_id === clinicId }));
  await saveFavorites(next);
  return next;
}
