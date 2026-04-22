const IDENTIFY_PROMPT = `You are analyzing a trading card game (TCG) card image.

Extract EXACTLY these fields from what you see on the card:
- "name": the card name printed at the top next to HP. DO NOT include "Basic Pokémon", "Stage 1", or evolution labels. For example if the card shows "Basic Pokémon Charmander", the name is "Charmander". If it shows "Ash's Pikachu" as the title, that full text is the name.
- "hp": the HP number shown next to the name (e.g., "40", "170"). Just the number.
- "number": the small card number printed at the bottom, usually bottom-right corner (e.g., "87/130", "4/102", "234/182"). Include the slash if visible.
- "set": the set name if printed on the card or indicated by a visible symbol (leave empty if uncertain).
- "era": "wizards" if you see "©Wizards of the Coast" or copyright dates 1995-2003. "modern" for newer cards (2004+).
- "features": any of these if visible, comma-separated: "ex", "GX", "V", "VMAX", "VSTAR", "Full Art", "Secret Rare", "Promo", "Shiny", "Holo", "Reverse Holo", "1st Edition".
- "game": "pokemon" for Pokémon TCG, "yugioh" for Yu-Gi-Oh!, "mtg" for Magic: The Gathering, "other" otherwise.

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
