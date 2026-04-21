import { Card } from '@/types';

const BASE_URL = 'https://db.ygoprodeck.com/api/v7';

interface YGOCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  race: string;
  card_sets?: Array<{
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
  }>;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
  }>;
}

export async function searchYugiohCards(query: string): Promise<Card[]> {
  const response = await fetch(`${BASE_URL}/cardinfo.php?fname=${encodeURIComponent(query)}&num=20&offset=0`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.data as YGOCard[]).map(mapCard);
}

export async function getYugiohCard(id: string): Promise<Card | null> {
  const response = await fetch(`${BASE_URL}/cardinfo.php?id=${id}`);
  if (!response.ok) return null;

  const data = await response.json();
  const cards = data.data as YGOCard[];
  return cards.length ? mapCard(cards[0]) : null;
}

function mapCard(raw: YGOCard): Card {
  const set = raw.card_sets?.[0];
  return {
    id: '',
    game: 'yugioh',
    apiId: raw.id.toString(),
    name: raw.name,
    setName: set?.set_name ?? 'Unknown Set',
    setCode: set?.set_code ?? '',
    number: set?.set_code ?? '',
    rarity: set?.set_rarity ?? 'Common',
    imageUrl: raw.card_images[0]?.image_url ?? '',
    supertype: raw.type,
  };
}
