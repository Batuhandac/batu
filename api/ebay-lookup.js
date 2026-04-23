const EBAY_APP_ID = process.env.EBAY_APP_ID ?? '';
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET ?? '';
const FINDING_BASE = 'https://svcs.ebay.com/services/search/FindingService/v1';
const BROWSE_BASE = 'https://api.ebay.com/buy/browse/v1';

// Module-level token cache (per warm serverless instance)
let _browseToken = null;
let _browseTokenExp = 0;

async function getBrowseToken() {
  if (_browseToken && Date.now() < _browseTokenExp) return _browseToken;
  if (!EBAY_APP_ID || !EBAY_CLIENT_SECRET) return null;
  try {
    const creds = Buffer.from(`${EBAY_APP_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
    const r = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });
    if (!r.ok) return null;
    const d = await r.json();
    _browseToken = d.access_token;
    _browseTokenExp = Date.now() + (d.expires_in - 120) * 1000;
    return _browseToken;
  } catch {
    return null;
  }
}

async function browseSearch(query, token) {
  try {
    const url = `${BROWSE_BASE}/item_summary/search?q=${encodeURIComponent(query)}&limit=20`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
    });
    if (!r.ok) return [];
    const d = await r.json();
    return d.itemSummaries ?? [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!EBAY_APP_ID) return res.status(503).json({ error: 'not_configured' });

  const { query, validate } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const browseToken = await getBrowseToken();

    const [soldItemsRaw, activeItemsRaw, browseItemsRaw] = await Promise.all([
      findItems('findCompletedItems', query, true),
      findItems('findItemsByKeywords', query, false),
      browseToken ? browseSearch(query, browseToken) : Promise.resolve([]),
    ]);

    // Normalize and validate: every returned item must match the card's identity
    const soldItems = filterValidated(soldItemsRaw, validate, 'finding');
    const activeItems = filterValidated(activeItemsRaw, validate, 'finding');
    const browseItems = filterValidated(browseItemsRaw, validate, 'browse');

    const price = extractPriceStats(soldItems);
    const image = extractBrowseImage(browseItems) ?? extractBestImage([...activeItems, ...soldItems]);
    const listings = formatListings(activeItems.slice(0, 3));

    return res.status(200).json({
      price,
      image,
      listings,
      soldCount: soldItems.length,
      matched: soldItems.length + activeItems.length + browseItems.length,
      totalReturned: soldItemsRaw.length + activeItemsRaw.length + browseItemsRaw.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}

// ── VALIDATION: ensure returned items actually match the scanned card ──
function filterValidated(items, validate, apiType) {
  if (!validate || (!validate.name && !validate.number)) return items;

  const nameTerms = termsFor(validate.name);
  const numberTerms = numberVariants(validate.number);

  return items.filter((item) => {
    const title = (apiType === 'browse' ? item.title : item.title?.[0]) ?? '';
    const t = title.toLowerCase();

    // Reject obvious non-matches
    if (/\blot\b|\bbundle\b|\bmixed\b|\bmystery\b|\bpack\b|\bsealed box\b/i.test(title)) {
      return false;
    }

    const numberHit = numberTerms.length === 0 || numberTerms.some((n) => t.includes(n));
    const nameHit = nameTerms.length === 0 || nameTerms.some((n) => t.includes(n));

    // Number is the strongest signal — require it if we have one
    if (numberTerms.length > 0) return numberHit && nameHit;
    return nameHit;
  });
}

function termsFor(name) {
  if (!name) return [];
  const n = name.toLowerCase().trim();
  const terms = [n];
  // Also allow partial name (first word, useful for "Naruto Uzumaki" → "naruto")
  const first = n.split(/\s+/)[0];
  if (first !== n && first.length > 2) terms.push(first);
  return terms;
}

function numberVariants(num) {
  if (!num) return [];
  const raw = num.toLowerCase().trim();
  const set = new Set();
  set.add(raw);
  // NS003 ↔ NS-003 ↔ NS 003 ↔ NS003
  if (/^[a-z]+\d+$/.test(raw)) {
    const m = raw.match(/^([a-z]+)(\d+)$/);
    if (m) {
      set.add(`${m[1]}-${m[2]}`);
      set.add(`${m[1]} ${m[2]}`);
    }
  }
  if (/^[a-z]+-\d+$/.test(raw)) {
    set.add(raw.replace('-', ''));
    set.add(raw.replace('-', ' '));
  }
  // 87/130 → also try just "87"
  if (raw.includes('/')) {
    set.add(raw.split('/')[0]);
  }
  return Array.from(set).filter((s) => s.length >= 2);
}

async function findItems(operation, query, soldOnly) {
  const params = new URLSearchParams({
    'OPERATION-NAME': operation,
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': EBAY_APP_ID,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'keywords': query,
    'sortOrder': soldOnly ? 'EndTimeSoonest' : 'BestMatch',
    'paginationInput.entriesPerPage': '20',
  });

  if (soldOnly) {
    params.set('itemFilter(0).name', 'SoldItemsOnly');
    params.set('itemFilter(0).value', 'true');
  }
  params.set('itemFilter(1).name', 'ExcludeCategory');
  params.set('itemFilter(1).value', '183051');

  const r = await fetch(`${FINDING_BASE}?${params.toString()}`);
  if (!r.ok) return [];

  const data = await r.json();
  const key = Object.keys(data)[0];
  return data[key]?.[0]?.searchResult?.[0]?.item ?? [];
}

function extractPriceStats(items) {
  if (!items.length) return null;

  const prices = items
    .map((item) => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0'))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (!prices.length) return null;

  // Trim top 10% (PSA slabs and mispricings) and bottom 5% (missold/damaged)
  const top = Math.ceil(prices.length * 0.9);
  const bottom = Math.floor(prices.length * 0.05);
  const trimmed = prices.slice(bottom, top);
  if (!trimmed.length) return null;

  const low = trimmed[0];
  const high = trimmed[trimmed.length - 1];
  const market = trimmed.reduce((s, p) => s + p, 0) / trimmed.length;
  const mid = trimmed[Math.floor(trimmed.length / 2)];

  return {
    low: parseFloat(low.toFixed(2)),
    mid: parseFloat(mid.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    market: parseFloat(market.toFixed(2)),
    currency: 'USD',
    source: 'ebay_sold',
    sampleSize: trimmed.length,
  };
}

function extractBestImage(items) {
  for (const item of items) {
    const large = item.pictureURLLarge?.[0] ?? item.pictureURLSuperSize?.[0];
    if (large?.startsWith('http')) return large;
    const gallery = item.galleryURL?.[0];
    if (gallery?.startsWith('http')) return gallery;
  }
  return null;
}

function extractBrowseImage(items) {
  for (const item of items) {
    const img = item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl;
    if (img?.startsWith('http')) return img;
  }
  return null;
}

function formatListings(items) {
  return items.map((item) => ({
    title: item.title?.[0] ?? item.title ?? '',
    price: parseFloat(
      item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ??
        item.price?.value ?? '0'
    ),
    currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] ??
      item.price?.currency ?? 'USD',
    image: item.galleryURL?.[0] ?? item.image?.imageUrl ?? null,
    url: item.viewItemURL?.[0] ?? item.itemWebUrl ?? null,
    condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? item.condition ?? null,
  }));
}
