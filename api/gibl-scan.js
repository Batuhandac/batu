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
    const buffer = Buffer.from(image, 'base64');
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

    const predict = await predictRes.json();

    if (predict.is_card !== 'card' || !predict.identity?.length) {
      return res.status(200).json({ found: false });
    }

    const topId = predict.identity[0];
    const cardIdentityId = topId.card_identity;
    const confidence = topId.card_identity_confidence / 100;
    // Normalize card_type: "one_piece" → "onepiece", "yu_gi_oh" → "yugioh", etc.
    const cardType = (predict.card_type ?? 'pokemon').replace(/_/g, '');

    const cardInfo = await lookupCard(cardType, cardIdentityId);

    return res.status(200).json({
      found: !!cardInfo,
      confidence,
      cardType,
      cardState: predict.card_state ?? null,
      authenticatorType: predict.authenticator_type ?? null,
      ...(cardInfo ?? {}),
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}

async function lookupCard(cardType, identityId) {
  // Try direct card endpoint
  try {
    const r = await fetch(`${GIBL_BASE}/${cardType}/card/${identityId}?key=${GIBL_KEY}`);
    if (r.ok) {
      const d = await r.json();
      if (d.cardId || d.name) return parseCard(d);
    }
  } catch {}

  // Fall back: card-list search — find the card whose cardId starts with "{identityId}-"
  try {
    const r = await fetch(
      `${GIBL_BASE}/${cardType}/card-list?key=${GIBL_KEY}&q=${encodeURIComponent(identityId)}&page=1`
    );
    if (r.ok) {
      const d = await r.json();
      const cards = d.data ?? [];
      const match =
        cards.find((c) => c.cardId?.startsWith(`${identityId}-`)) ?? cards[0] ?? null;
      if (match) return parseCard(match);
    }
  } catch {}

  return null;
}

// cardId format from GiblTCG: "{giblId}-{setCode}-{number}"
// e.g. "42-hgss4-1" → setCode="hgss4", number="1"
// Sets with hyphens like "sv8pt5" are preserved by joining middle segments
function parseCard(card) {
  const rawId = card.cardId ?? '';
  const parts = rawId.split('-');
  let setCode = '';
  let number = '';
  if (parts.length >= 3) {
    setCode = parts.slice(1, -1).join('-');
    number = parts[parts.length - 1];
  } else if (parts.length === 2) {
    setCode = parts[1];
  }
  return {
    giblCardId: rawId,
    name: card.name ?? '',
    imageUrl: card.image ?? '',
    setCode,
    number,
  };
}
