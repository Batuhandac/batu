const EBAY_APP_ID = process.env.EBAY_APP_ID ?? '';
const FINDING_BASE = 'https://svcs.ebay.com/services/search/FindingService/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!EBAY_APP_ID) return res.status(503).json({ error: 'not_configured' });

  const { query } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const [soldItems, activeItems] = await Promise.all([
      findItems('findCompletedItems', query, true),
      findItems('findItemsByKeywords', query, false),
    ]);

    const price = extractPriceStats(soldItems);
    const image = extractBestImage([...activeItems, ...soldItems]);
    const listings = formatListings(activeItems.slice(0, 3));

    return res.status(200).json({ price, image, listings, soldCount: soldItems.length });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}

async function findItems(operation, query, soldOnly) {
  const params = new URLSearchParams({
    'OPERATION-NAME': operation,
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': EBAY_APP_ID,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'keywords': query,
    'sortOrder': soldOnly ? 'EndTimeSoonest' : 'BestMatch',
    'paginationInput.entriesPerPage': '15',
  });

  if (soldOnly) {
    params.set('itemFilter(0).name', 'SoldItemsOnly');
    params.set('itemFilter(0).value', 'true');
  }
  // Exclude lots/bundles
  params.set('itemFilter(1).name', 'ExcludeCategory');
  params.set('itemFilter(1).value', '183051'); // eBay "Wholesale Lots" category

  const r = await fetch(`${FINDING_BASE}?${params.toString()}`);
  if (!r.ok) return [];

  const data = await r.json();
  const key = Object.keys(data)[0];
  return data[key]?.[0]?.searchResult?.[0]?.item ?? [];
}

function extractPriceStats(items) {
  if (!items.length) return null;

  const prices = items
    .map((item) => {
      const title = (item.title?.[0] ?? '').toLowerCase();
      // Skip lots, bundles, sets
      if (/\blot\b|\bbundle\b|\bset\b|\bx\d+\b|\d+\s*card/i.test(title)) return null;
      return parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0');
    })
    .filter((p) => p !== null && p > 0)
    .sort((a, b) => a - b);

  if (!prices.length) return null;

  // Remove top 10% outliers (graded slabs etc.)
  const trimmed = prices.slice(0, Math.ceil(prices.length * 0.9));
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

function formatListings(items) {
  return items.map((item) => ({
    title: item.title?.[0] ?? '',
    price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ?? '0'),
    currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] ?? 'USD',
    image: item.galleryURL?.[0] ?? null,
    url: item.viewItemURL?.[0] ?? null,
    condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? null,
  }));
}
