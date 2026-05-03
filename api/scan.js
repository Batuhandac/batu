const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image. Identify the game first, then extract fields.

GAME DETECTION:
- "pokemon": Pokémon TCG — has HP value, energy symbols, ©Nintendo/©Wizards
- "yugioh": Yu-Gi-Oh! — ATK/DEF numbers at bottom, KONAMI copyright, horizontal landscape layout or portrait with colored border
- "mtg": Magic: The Gathering — mana cost top-right, tap symbol, ©Wizards of the Coast, collector number bottom-left like "233/273"
- "onepiece": One Piece Card Game — BANDAI copyright, DON!! mechanic text, card codes like "OP01-001" or "P-001", ONE PIECE branding
- "lorcana": Disney Lorcana — Disney copyright, ink drop symbols, lore/strength values, Disney character art
- "naruto": Naruto card games — Naruto Kayou (KaYou logo, Chinese) or old Naruto TCG (Bandai/Score US, ©2002 Masashi Kishimoto)
- "other": not a TCG card

FIELD EXTRACTION:
- "name": character/card name only. Strip "Basic", "Stage 1/2", "VMAX" labels — just the creature/character name.
- "hp": HP/life value (Pokémon only).
- "number":
  • Pokémon: bottom corner e.g. "87/130", "234/182"
  • One Piece: full card code e.g. "OP01-001", "ST13-003", "P-001"
  • Yu-Gi-Oh!: the 8-DIGIT PASSCODE at the very bottom-left corner (e.g. "46986414"). This is NOT the ATK or DEF value. Do NOT confuse with ATK/DEF numbers.
  • Magic: The Gathering: collector number bottom-left e.g. "233/273" or "233"
  • Lorcana: collector number if visible
  • Naruto Kayou: card code e.g. "NT-R001", "BT1-001"
  • Old Naruto TCG (2002-2006): bottom-left code like "PR001", "N-001", "M-HOU-001". IMPORTANT: battle stats at the bottom (like "3/1", "1/0", "4/2") are NOT card numbers — ignore them.
- "set": set name or code printed on the card.
- "era": "wizards" for ©Wizards or 1995-2003 Pokémon. "modern" for 2004+ Pokémon. "kayou" for Naruto Kayou.
- "features": comma-separated: ex, GX, V, VMAX, VSTAR, Leader, Holo, Reverse Holo, Secret Rare, Full Art, Alt Art, 1st Edition, Promo, Enchanted, SP, Parallel

Reply with ONLY valid JSON. No prose, no markdown, no code fences:
{"name":"...","hp":"...","number":"...","set":"...","era":"...","features":"...","game":"pokemon"}

If it is not a TCG card at all: {"name":"","game":"other"}`;

const EXACT_PRINT_PROMPT = `${IDENTIFY_PROMPT}

EXACT PRINTING RULES:
- The goal is exact physical printing, not just the character name.
- For Pokemon, read the bottom set/card number exactly and capture visible rarity/foil cues such as Holo, Reverse Holo, Secret Rare, 1st Edition, Promo, Full Art, Alt Art.
- For Yu-Gi-Oh!, prefer the printed set code such as LOB-001, RA01-EN000, SDY-006. Use the 7-8 digit passcode only when no printed set code is visible.
- When a printed code is visible, put it in "number"; for Yu-Gi-Oh! also put it in "set".
- If glare, crop, or blur prevents exact print identification, still return the best fields you can read but do not invent set, number, or rarity.`;

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });
  const parsedImage = parseImageInput(image);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: parsedImage.mediaType, data: parsedImage.data } },
              { type: 'text', text: EXACT_PRINT_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ game: 'other', name: '' });

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
