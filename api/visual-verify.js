const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';

const VERIFY_PROMPT = `You are verifying whether two trading card images show the same exact physical card printing.

Image 1 is a user photo. Image 2 is the official/reference card image.

Check exact print, not just character:
- card name/title
- artwork
- printed card number
- set symbol or set code if visible
- rarity/foil/parallel cues if visible
- language and obvious variant differences

Return ONLY valid JSON:
{"exact":true,"confidence":0.0,"reasons":["..."],"mismatches":["..."]}

Rules:
- If the card name/artwork differs, exact=false.
- If printed number differs, exact=false.
- If the user photo is too blurry/cropped/glared to verify the printed number or set, exact=false.
- If foil/parallel/first edition cues appear different, exact=false.
- Use confidence 0.90+ only when the exact physical printing is strongly supported.`;

function parseImageInput(input) {
  const raw = String(input ?? '');
  const dataUri = raw.match(/^data:([^;]+);base64,(.*)$/);
  if (dataUri) return { data: dataUri[2], mediaType: dataUri[1] };

  const data = raw.includes(',') ? raw.split(',').pop() : raw;
  if (data.startsWith('/9j/')) return { data, mediaType: 'image/jpeg' };
  if (data.startsWith('iVBORw0KGgo')) return { data, mediaType: 'image/png' };
  if (data.startsWith('UklGR')) return { data, mediaType: 'image/webp' };
  return { data, mediaType: 'image/jpeg' };
}

function detectMediaTypeFromBytes(bytes, fallback = 'image/jpeg') {
  const view = new Uint8Array(bytes);
  if (view[0] === 0xff && view[1] === 0xd8) return 'image/jpeg';
  if (
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47
  ) return 'image/png';
  if (
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46
  ) return 'image/webp';
  return fallback;
}

async function fetchReferenceImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`reference_download_failed:${response.status}`);
  const bytes = await response.arrayBuffer();
  const headerType = response.headers.get('content-type')?.split(';')[0]?.trim();
  const mediaType = headerType?.startsWith('image/')
    ? headerType
    : detectMediaTypeFromBytes(bytes);
  return {
    data: Buffer.from(bytes).toString('base64'),
    mediaType,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'not_configured' });

  const { image, referenceImageUrl, expected } = req.body ?? {};
  if (!image || !referenceImageUrl) {
    return res.status(400).json({ error: 'image and referenceImageUrl required' });
  }

  try {
    const parsedImage = parseImageInput(image);
    const referenceImage = await fetchReferenceImage(referenceImageUrl);
    const expectedText = expected
      ? `Expected candidate metadata: ${JSON.stringify(expected)}`
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 220,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: parsedImage.mediaType, data: parsedImage.data } },
              { type: 'image', source: { type: 'base64', media_type: referenceImage.mediaType, data: referenceImage.data } },
              { type: 'text', text: `${VERIFY_PROMPT}\n\n${expectedText}` },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ error: 'anthropic_verify_failed', detail });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ exact: false, confidence: 0, reasons: [], mismatches: ['no_json'] });

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({
      exact: !!parsed.exact,
      confidence: Number(parsed.confidence ?? 0),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      mismatches: Array.isArray(parsed.mismatches) ? parsed.mismatches : [],
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}
