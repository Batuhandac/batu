const POKE_KEY = process.env.POKEMONTCG_API_KEY ?? '';
const TCG_PUBLIC = process.env.TCGPLAYER_PUBLIC_KEY ?? '';
const TCG_PRIVATE = process.env.TCGPLAYER_PRIVATE_KEY ?? '';
const POKE_BASE = 'https://api.pokemontcg.io/v2';
const TCG_BASE = 'https://api.tcgplayer.com';

const RARITY_LOW = new Set(['common', 'uncommon']);
const PRICE_VARIANTS = ['holofoil', 'normal', 'reverseHolofoil', 'firstEditionHolofoil', 'firstEditionNormal', 'unlimitedHolofoil', 'unlimited'];
const EUR_USD = 1.10;

// Module-level token cache (lives as long as the serverless instance is warm)
let _tcgToken = null;
let _tcgTokenExp = 0;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cardId, tcgplayerUrl, rarity } = req.body ?? {};
  if (!cardId) return res.status(400).json({ error: 'cardId required' });

  const isLowRarity = RARITY_LOW.has((rarity ?? '').toLowerCase());

  // Source 1 — TCGPlayer direct API (real-time, most accurate)
  if (TCG_PUBLIC && TCG_PRIVATE && tcgplayerUrl) {
    try {
      const prices = await fetchTCGPlayerDirect(tcgplayerUrl);
      if (prices) return res.status(200).json({ source: 'tcgplayer_direct', ...prices });
    } catch {}
  }

  // Source 2 — Pokémon TCG API (TCGPlayer + CardMarket data, updated daily)
  try {
    const prices = await fetchPokemonTCGApi(cardId, isLowRarity);
    if (prices) return res.status(200).json({ source: 'pokemontcg', ...prices });
  } catch {}

  return res.status(200).json({ source: 'none', low: null, mid: null, high: null, market: null });
}

async function fetchTCGPlayerDirect(tcgplayerUrl) {
  const productId = tcgplayerUrl?.match(/product\/(\d+)/)?.[1];
  if (!productId) return null;

  const token = await getTCGToken();
  if (!token) return null;

  const r = await fetch(`${TCG_BASE}/v1.37.0/pricing/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;

  const data = await r.json();
  const results = data.results ?? [];

  // Build variant map and pick best
  const variantMap = {};
  for (const item of results) {
    variantMap[item.subTypeName?.toLowerCase()] = {
      low: item.lowPrice,
      mid: item.midPrice,
      high: item.highPrice,
      market: item.marketPrice,
      directLow: item.directLowPrice,
    };
  }

  for (const v of PRICE_VARIANTS) {
    const p = variantMap[v];
    const ref = p?.market ?? p?.mid;
    if (ref && ref > 0) {
      return {
        variant: v,
        low: p.low ?? ref * 0.7,
        mid: p.mid ?? ref,
        high: p.high ?? ref * 1.5,
        market: ref,
        allVariants: variantMap,
      };
    }
  }
  return null;
}

async function getTCGToken() {
  if (_tcgToken && Date.now() < _tcgTokenExp) return _tcgToken;
  const r = await fetch(`${TCG_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${TCG_PUBLIC}&client_secret=${TCG_PRIVATE}`,
  });
  if (!r.ok) return null;
  const data = await r.json();
  _tcgToken = data.access_token;
  _tcgTokenExp = Date.now() + 50 * 60 * 1000; // 50 min
  return _tcgToken;
}

async function fetchPokemonTCGApi(cardId, isLowRarity) {
  const headers = { Accept: 'application/json' };
  if (POKE_KEY) headers['X-Api-Key'] = POKE_KEY;

  const r = await fetch(`${POKE_BASE}/cards/${cardId}`, { headers });
  if (!r.ok) return null;
  const data = await r.json();
  const card = data.data;
  if (!card) return null;

  // TCGPlayer prices
  const tcg = card.tcgplayer?.prices;
  if (tcg) {
    for (const key of PRICE_VARIANTS) {
      const p = tcg[key];
      const ref = p?.market ?? p?.mid;
      if (ref && ref > 0) {
        return {
          variant: key,
          low: p.low ?? ref * 0.7,
          mid: p.mid ?? ref,
          high: p.high ?? ref * 1.5,
          market: ref,
          updatedAt: card.tcgplayer?.updatedAt,
        };
      }
    }
    for (const key of Object.keys(tcg)) {
      const p = tcg[key];
      const ref = p?.market ?? p?.mid;
      if (ref && ref > 0) {
        return {
          variant: key,
          low: p.low ?? ref * 0.7,
          mid: p.mid ?? ref,
          high: p.high ?? ref * 1.5,
          market: ref,
          updatedAt: card.tcgplayer?.updatedAt,
        };
      }
    }
  }

  // CardMarket fallback — skip for low-rarity cards (often has bad data)
  const cm = card.cardmarket?.prices;
  if (cm?.averageSellPrice && cm.averageSellPrice > 0) {
    const avg = cm.averageSellPrice * EUR_USD;
    if (isLowRarity && avg > 5) return null;
    return {
      variant: 'cardmarket',
      low: (cm.lowPrice ?? cm.averageSellPrice * 0.7) * EUR_USD,
      mid: avg,
      high: (cm.trendPrice ?? cm.averageSellPrice * 1.3) * EUR_USD,
      market: avg,
      updatedAt: card.cardmarket?.updatedAt,
    };
  }

  return null;
}
