import { Game, ScanResult } from '@/types';
import { scanCardWithVision } from './cardScanner';

const BASE_URL = process.env.EXPO_PUBLIC_GIBLTCG_BASE_URL ?? 'https://api.gibltcg.com/v1';
const RAW_API_KEY = process.env.EXPO_PUBLIC_GIBLTCG_API_KEY ?? '';
const PLACEHOLDER_KEYS = new Set(['', 'your-gibltcg-key', 'placeholder', 'demo']);
const API_KEY = PLACEHOLDER_KEYS.has(RAW_API_KEY) ? '' : RAW_API_KEY;

export interface GiblScanResponse {
  success: boolean;
  results: Array<{
    confidence: number;
    game: string;
    card: {
      id: string;
      name: string;
      set_name: string;
      set_code: string;
      number: string;
      rarity: string;
      image_url: string;
    };
  }>;
  error?: string;
}

export async function scanCardImage(imageBase64: string): Promise<ScanResult[]> {
  const visionResults = await scanCardWithVision(imageBase64);
  if (visionResults.length > 0) return visionResults;

  if (!API_KEY) return [];

  try {
    const response = await fetch(`${BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        max_results: 3,
      }),
    });

    if (!response.ok) {
      console.warn(`GiblTCG scan failed: ${response.status}`);
      return [];
    }

    const data: GiblScanResponse = await response.json();
    if (!data.success || !data.results?.length) return [];

    return data.results.map((r) => ({
      confidence: r.confidence,
      card: {
        id: '',
        game: r.game as Game,
        apiId: r.card.id,
        name: r.card.name,
        setName: r.card.set_name,
        setCode: r.card.set_code,
        number: r.card.number,
        rarity: r.card.rarity,
        imageUrl: r.card.image_url,
      },
    }));
  } catch (err) {
    console.warn('GiblTCG network error:', err);
    return [];
  }
}
