const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image.

Identify the game first, then extract fields accordingly.

GAME DETECTION:
- "pokemon": Pokémon TCG (has HP, energy symbols, ©Nintendo/©Wizards)
- "yugioh": Yu-Gi-Oh! (ATK/DEF numbers, KONAMI copyright)
- "mtg": Magic: The Gathering (tap symbol, mana cost top-right, ©Wizards of the Coast)
- "onepiece": One Piece Card Game (Bandai, has DON!! text, leader/character/event card types, card codes like "OP01-001")
- "naruto": Naruto card games — Naruto Kayou (Chinese cards with Naruto characters, KaYou logo) or old Naruto TCG (Bandai/Naruto US cards)
- "other": anything else or not a TCG card

Extract these fields:
- "name": character/card name only. For Pokémon: strip "Basic", "Stage 1/2", "Pokémon VMAX" labels — just the creature name. For One Piece/Naruto: full character name as printed.
- "hp": HP/life value number only (Pokémon). For One Piece leader cards, the life value. Leave empty if not applicable.
- "number":
  • Pokémon: bottom corner number e.g. "87/130", "234/182"
  • One Piece: full card code e.g. "OP01-001", "ST13-003", "P-001"
  • Naruto Kayou: card code e.g. "NT-R001", "BT1-001"
  • Yu-Gi-Oh!/MTG: card number if visible
- "set": set name or expansion name printed on card. For One Piece: e.g. "Romance Dawn", "Paramount War". For Naruto Kayou: series name.
- "era": "wizards" if ©Wizards of the Coast or 1995-2003 dates. "modern" for 2004+. "kayou" for Naruto Kayou cards.
- "features": comma-separated visible features: "Leader", "ex", "GX", "V", "VMAX", "VSTAR", "Full Art", "Secret Rare", "Promo", "Holo", "Reverse Holo", "1st Edition", "Parallel", "Alt Art", "SP"

Reply with ONLY a JSON object. No prose, no markdown, no code fences:
{"name":"...","hp":"...","number":"...","set":"...","era":"...","features":"...","game":"pokemon"}

If image is not a TCG card at all, reply: {"name":"","game":"other"}`;

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

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: IDENTIFY_PROMPT },
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
