const fs = require('fs');
const path = require('path');

const POKEMON_BASE = 'https://api.pokemontcg.io/v2';
const DEFAULT_API_BASE = 'https://batu-tcg.vercel.app';
const DEFAULT_LIMIT = 20;
const DEFAULT_SET = 'base1';

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

function expectedNumberParts(card) {
  return {
    number: String(card.number ?? '').trim(),
    printedTotal: String(card.set?.printedTotal ?? '').trim(),
  };
}

function actualNumberParts(actual) {
  const raw = String(actual.number ?? '').trim();
  const parts = raw.split('/').map((item) => item.trim()).filter(Boolean);
  return {
    number: parts[0] ?? raw,
    printedTotal: String(actual.printedTotal ?? parts[1] ?? '').trim(),
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

async function imageToBase64(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
  const bytes = await res.arrayBuffer();
  return Buffer.from(bytes).toString('base64');
}

async function scanWithAnthropic(apiBase, imageUrl) {
  const image = await imageToBase64(imageUrl);
  const res = await fetch(`${apiBase.replace(/\/+$/, '')}/api/scan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw new Error(`Anthropic scan failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function compare(card, actual) {
  const expectedNum = expectedNumberParts(card);
  const actualNum = actualNumberParts(actual);
  const nameOk = normalize(card.name) === normalize(actual.name);
  const numberOk = normalizeCardNumber(expectedNum.number) === normalizeCardNumber(actualNum.number);
  const totalOk = expectedNum.printedTotal && expectedNum.printedTotal === actualNum.printedTotal;
  const gameOk = actual.game === 'pokemon';

  return {
    id: card.id,
    status: gameOk && nameOk && numberOk && totalOk ? 'correct' : 'wrong',
    expected: {
      game: 'pokemon',
      name: card.name,
      number: expectedNum.number,
      printedTotal: expectedNum.printedTotal,
      setCode: card.set?.id ?? '',
      setName: card.set?.name ?? '',
      imageUrl: card.images?.large ?? card.images?.small ?? '',
    },
    actual,
    checks: { gameOk, nameOk, numberOk, totalOk },
  };
}

async function main() {
  const limit = Number(argValue('limit', DEFAULT_LIMIT));
  const apiBase = argValue('api-base', process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE);
  const setsArg = argValue('sets', '');
  const setId = argValue('set', DEFAULT_SET);
  const setIds = setsArg
    ? setsArg.split(',').map((item) => item.trim()).filter(Boolean)
    : [setId];

  const outDir = path.join(process.cwd(), 'scan-fixtures', 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Anthropic Pokemon scan benchmark');
  console.log(`API: ${apiBase}`);
  console.log(`Sets: ${setIds.join(', ')}`);
  console.log(`Limit: ${limit}`);
  console.log(`Requests: this will consume about ${limit} Anthropic vision requests`);

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
    process.stdout.write(`[${index + 1}/${cards.length}] ${card.name} #${card.number}/${card.set?.printedTotal ?? ''} ... `);
    try {
      const actual = await scanWithAnthropic(apiBase, imageUrl);
      const result = compare(card, actual);
      results.push(result);
      console.log(result.status);
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
    provider: 'anthropic',
    apiBase,
    setIds,
    limit,
    totals,
    correctRate: results.length ? (totals.correct ?? 0) / results.length : 0,
    results,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const setLabel = setIds.length === 1 ? setIds[0] : 'multi';
  const outFile = path.join(outDir, `anthropic-pokemon-${setLabel}-${limit}-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('');
  console.log(`Report: ${path.relative(process.cwd(), outFile)}`);
  console.log(`Correct: ${totals.correct ?? 0}`);
  console.log(`Wrong: ${totals.wrong ?? 0}`);
  console.log(`Errors: ${totals.error ?? 0}`);
  console.log(`Correct rate: ${((report.correctRate ?? 0) * 100).toFixed(1)}%`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
