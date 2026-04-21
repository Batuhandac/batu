import { Card } from '@/types';

const BASE_URL = 'https://api.pokemontcg.io/v2';

interface PokemonTCGCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
}

export async function searchPokemonCards(query: string): Promise<Card[]> {
  const params = new URLSearchParams({ q: `name:"${query}*"`, pageSize: '20' });
  const response = await fetch(`${BASE_URL}/cards?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.data as PokemonTCGCard[]).map(mapCard);
}

export async function getPokemonCard(id: string): Promise<Card | null> {
  const response = await fetch(`${BASE_URL}/cards/${id}`);
  if (!response.ok) return null;

  const data = await response.json();
  return mapCard(data.data as PokemonTCGCard);
}

export async function getPokemonSet(setId: string): Promise<Card[]> {
  const params = new URLSearchParams({ q: `set.id:${setId}`, pageSize: '250' });
  const response = await fetch(`${BASE_URL}/cards?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.data as PokemonTCGCard[]).map(mapCard);
}

function mapCard(raw: PokemonTCGCard): Card {
  return {
    id: '',
    game: 'pokemon',
    apiId: raw.id,
    name: raw.name,
    setName: raw.set.name,
    setCode: raw.set.id,
    number: raw.number,
    rarity: raw.rarity ?? 'Common',
    imageUrl: raw.images.large,
    supertype: raw.supertype,
    subtypes: raw.subtypes,
    hp: raw.hp ? parseInt(raw.hp) : undefined,
    artist: raw.artist,
  };
}
