const GIBL_KEY = process.env.GIBLTCG_API_KEY ?? '';
const GIBL_BASE = 'https://gibltcg.com/api/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GIBL_KEY) return res.status(503).json({ error: 'not_configured' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    const cleanImage = String(image).includes(',') ? String(image).split(',').pop() : String(image);
    const buffer = Buffer.from(cleanImage, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'card.jpg');

    const predictRes = await fetch(`${GIBL_BASE}/predict-card?key=${GIBL_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!predictRes.ok) {
      const detail = await predictRes.text();
      return res.status(502).json({ error: 'gibl_predict_failed', status: predictRes.status, detail });
    }

    const prediction = parsePredictCardResponse(await predictRes.json());
    if (!prediction) return res.status(200).json({ found: false });

    const cardInfo = await lookupCard(prediction.cardType, prediction.cardIdentityId);
    const match = prediction.match ?? {};

    return res.status(200).json({
      found: !!cardInfo || !!match.name,
      confidence: prediction.confidence,
      cardType: prediction.cardType,
      cardState: prediction.cardState,
      authenticatorType: prediction.authenticatorType,
      name: cardInfo?.name ?? match.name ?? '',
      number: cardInfo?.number ?? match.number ?? '',
      printedTotal: match.printedTotal ?? '',
      imageUrl: cardInfo?.imageUrl ?? '',
      setCode: cardInfo?.setCode ?? '',
      giblCardId: cardInfo?.giblCardId ?? '',
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}

function parsePredictCardResponse(raw) {
  const item = Array.isArray(raw.items) ? raw.items[0] : null;
  const best = item?.card?.identity?.best;

  if (best?.match?.name) {
    return {
      cardIdentityId: best.label,
      confidence: normalizeConfidence(best.confidence),
      cardType: normalizeCardType(item.card?.type?.label ?? 'pokemon'),
      match: best.match,
      cardState: item.grading?.state?.label ?? item.card?.state?.label ?? null,
      authenticatorType: item.grading?.authenticator?.label ?? null,
    };
  }

  if (raw.is_card !== 'card' || !raw.identity?.length) return null;

  const topId = raw.identity[0];
  return {
    cardIdentityId: topId.card_identity,
    confidence: normalizeConfidence(topId.card_identity_confidence),
    cardType: normalizeCardType(raw.card_type ?? 'pokemon'),
    match: null,
    cardState: raw.card_state ?? null,
    authenticatorType: raw.authenticator_type ?? null,
  };
}

function normalizeConfidence(raw) {
  const value = Number(raw ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
}

function normalizeCardType(raw) {
  const compact = String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = {
    onepiece: 'onepiece',
    onepiecetcg: 'onepiece',
    yugioh: 'yugioh',
    yugiohtcg: 'yugioh',
    pokemon: 'pokemon',
    pokemontcg: 'pokemon',
    mtg: 'mtg',
    magic: 'mtg',
    magicthegathering: 'mtg',
    lorcana: 'lorcana',
    naruto: 'naruto',
  };
  return aliases[compact] ?? compact;
}

async function lookupCard(cardType, identityId) {
  if (!identityId) return null;

  try {
    const r = await fetch(`${GIBL_BASE}/${cardType}/card/${identityId}?key=${GIBL_KEY}`);
    if (r.ok) {
      const d = await r.json();
      if (d.cardId || d.name) return parseCard(d);
    }
  } catch {}

  try {
    const r = await fetch(
      `${GIBL_BASE}/${cardType}/card-list?key=${GIBL_KEY}&q=${encodeURIComponent(identityId)}&page=1`,
    );
    if (r.ok) {
      const d = await r.json();
      const cards = d.data ?? [];
      const match = cards.find((c) => c.cardId?.startsWith(`${identityId}-`)) ?? cards[0] ?? null;
      if (match) return parseCard(match);
    }
  } catch {}

  return null;
}

function parseCard(card) {
  const rawId = card.cardId ?? '';
  const parts = rawId.split('-');
  let setCode = card.setCode ?? '';
  let number = card.number ?? '';

  if (!setCode && parts.length >= 3) {
    setCode = parts.slice(1, -1).join('-');
    number = parts[parts.length - 1];
  } else if (!setCode && parts.length === 2) {
    setCode = parts[0];
    number = parts[1];
  }

  return {
    giblCardId: rawId,
    name: card.name ?? '',
    imageUrl: card.image ?? card.imageUrl ?? '',
    setCode,
    number,
  };
}
