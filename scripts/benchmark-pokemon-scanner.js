const fs = require('fs');
const path = require('path');

const POKEMON_BASE = 'https://api.pokemontcg.io/v2';
const GIBL_BASE = 'https://gibltcg.com/api/v1';
const DEFAULT_LIMIT = 10;
const DEFAULT_SET = 'base1';
const MIN_STRONG_CONFIDENCE = 0.88;

loadEnvFile(path.join(process.cwd(), '.env.local'));

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeCardNumber(value) {
  const raw = String(value ?? '').trim();
  const [number] = raw.split('/');
  return number.trim().replace(/^0+(\d)/, '$1');
}

function normalizeConfidence(raw) {
  const value = Number(raw ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
}

function parseGibl(raw) {
  const item = Array.isArray(raw.items) ? raw.items[0] : null;
  const best = item?.card?.identity?.best;
  if (best?.match?.name) {
    return {
      cardType: normalize(item.card?.type?.label ?? 'pokemon'),
      confidence: normalizeConfidence(best.confidence),
      name: best.match.name ?? '',
      number: best.match.number ?? '',
      printedTotal: String(best.match.printedTotal ?? ''),
      raw,
    };
  }

  const topId = raw.identity?.[0];
  return {
    cardType: normalize(raw.card_type ?? 'pokemon'),
    confidence: normalizeConfidence(topId?.card_identity_confidence),
    name: '',
    number: '',
    printedTotal: '',
    raw,
  };
}

async function fetchPokemonCards({ setId, limit }) {
  const headers = { Accept: 'application/json' };
  const key = process.env.POKEMONTCG_API_KEY ?? process.env.EXPO_PUBLIC_POKEMONTCG_API_KEY;
  if (key) headers['X-Api-Key'] = key;

  const query = `set.id:${setId}`;
  const url = `${POKEMON_BASE}/cards?q=${encodeURIComponent(query)}&orderBy=number&pageSize=${limit}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Pokemon API failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data ?? [];
}

async function scanWithGibl(imageUrl) {
  const key = process.env.GIBLTCG_API_KEY;
  if (!key) throw new Error('GIBLTCG_API_KEY missing');

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`);
  const bytes = await imageRes.arrayBuffer();
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, 'card.jpg');

  const predictRes = await fetch(`${GIBL_BASE}/predict-card?key=${key}`, {
    method: 'POST',
    body: formData,
  });
  if (!predictRes.ok) throw new Error(`Gibl failed: ${predictRes.status} ${await predictRes.text()}`);
  return parseGibl(await predictRes.json());
}

function compare(card, scan) {
  const expectedTotal = String(card.set?.printedTotal ?? '');
  const expected = {
    game: 'pokemon',
    name: card.name,
    setCode: card.set?.id ?? '',
    setName: card.set?.name ?? '',
    number: card.number,
    printedTotal: expectedTotal,
    rarity: card.rarity ?? '',
    imageUrl: card.images?.large ?? card.images?.small ?? '',
  };
  const actual = {
    game: scan.cardType,
    name: scan.name,
    number: scan.number,
    printedTotal: scan.printedTotal,
    confidence: scan.confidence,
  };

  const nameOk = normalize(expected.name) === normalize(actual.name);
  const numberOk = normalizeCardNumber(expected.number) === normalizeCardNumber(actual.number);
  const totalOk = expected.printedTotal && expected.printedTotal === actual.printedTotal;
  const exact = nameOk && numberOk && totalOk;
  const status = exact && scan.confidence >= MIN_STRONG_CONFIDENCE
    ? 'verified'
    : exact
      ? 'needs_review'
      : 'wrong';

  return {
    id: card.id,
    status,
    exact,
    strongConfidence: scan.confidence >= MIN_STRONG_CONFIDENCE,
    expected,
    actual,
    checks: { nameOk, numberOk, totalOk },
  };
}

async function main() {
  const limit = Number(argValue('limit', DEFAULT_LIMIT));
  const setsArg = argValue('sets', '');
  const setId = argValue('set', DEFAULT_SET);
  const setIds = setsArg
    ? setsArg.split(',').map((item) => item.trim()).filter(Boolean)
    : [setId];
  const outDir = path.join(process.cwd(), 'scan-fixtures', 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Pokemon scanner benchmark`);
  console.log(`Sets: ${setIds.join(', ')}`);
  console.log(`Limit: ${limit}`);
  console.log(`Credits: this will consume about ${limit} Gibl scan credits`);

  const perSetLimit = Math.max(1, Math.ceil(limit / setIds.length));
  const cards = [];
  for (const currentSetId of setIds) {
    const setCards = await fetchPokemonCards({ setId: currentSetId, limit: perSetLimit });
    cards.push(...setCards);
  }
  cards.length = Math.min(cards.length, limit);

  const results = [];

  for (const [index, card] of cards.entries()) {
    const imageUrl = card.images?.large ?? card.images?.small;
    if (!imageUrl) continue;

    process.stdout.write(`[${index + 1}/${cards.length}] ${card.name} #${card.number} ... `);
    try {
      const scan = await scanWithGibl(imageUrl);
      const result = compare(card, scan);
      results.push(result);
      console.log(`${result.status} (${Math.round(scan.confidence * 100)}%)`);
    } catch (error) {
      results.push({
        id: card.id,
        status: 'error',
        expected: {
          name: card.name,
          number: card.number,
          printedTotal: String(card.set?.printedTotal ?? ''),
          imageUrl,
        },
        error: String(error),
      });
      console.log('error');
    }
  }

  const totals = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const report = {
    createdAt: new Date().toISOString(),
    provider: 'gibltcg',
    setIds,
    limit,
    minStrongConfidence: MIN_STRONG_CONFIDENCE,
    totals,
    exactRate: results.length ? results.filter((r) => r.exact).length / results.length : 0,
    verifiedRate: results.length ? (totals.verified ?? 0) / results.length : 0,
    results,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const setLabel = setIds.length === 1 ? setIds[0] : 'multi';
  const outFile = path.join(outDir, `pokemon-${setLabel}-${limit}-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('');
  console.log(`Report: ${path.relative(process.cwd(), outFile)}`);
  console.log(`Verified: ${totals.verified ?? 0}`);
  console.log(`Needs review: ${totals.needs_review ?? 0}`);
  console.log(`Wrong: ${totals.wrong ?? 0}`);
  console.log(`Errors: ${totals.error ?? 0}`);

  if ((totals.wrong ?? 0) > 0 || (totals.error ?? 0) > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
