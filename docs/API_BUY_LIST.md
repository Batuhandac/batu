# Cardory API Buy List

Last checked: 2026-05-03

## Buy Now

1. GiblTCG Premium
   - Purpose: primary card image recognition.
   - Why: live Vision API, multi-card detection, perspective correction, slab detection, structured `predict-card` response.
   - Price seen: Premium $59.99/month promotional, 3,000 monthly tokens, 100 requests/min, commercial use.
   - URL: https://gibltcg.com/subscription-api-pricing

2. Anthropic API
   - Purpose: second-pass OCR/vision validator for exact print evidence.
   - Use model: `claude-sonnet-4-20250514`.
   - Why: app must not trust one provider when confidence is low. Claude reads bottom card number, set, rarity/foil cues and cross-checks Gibl.
   - URL: https://docs.anthropic.com/en/docs/build-with-claude/vision

3. eBay Developer keys
   - Purpose: sold comps and marketplace enrichment for One Piece, Naruto, slabs and low-data cards.
   - Product rule: do not use eBay listing photos as canonical card images; they are too inconsistent.
   - Required env: `EBAY_APP_ID`, `EBAY_CLIENT_SECRET`.
   - URL: https://developer.ebay.com/api-docs/buy/api-browse.html

4. Card Hedge API access
   - Purpose: secondary enterprise-grade image search / card identification for categories beyond mainstream TCG coverage.
   - Why: they advertise computer vision under 1 second plus broad card categories; useful as a fallback provider for "every card" ambitions.
   - URL: https://api.cardhedger.com/

## Add After Scan Is Stable

1. Scrydex Growth
   - Purpose: multi-TCG catalog, raw/graded prices, price history.
   - Do not buy for scan yet: pricing page currently says AI Card Image Recognition is "Coming Soon".
   - Recommended plan when needed: Growth $99/month, 50,000 credits.
   - URL: https://scrydex.com/pricing

2. PokeTrace Pro Trader
   - Purpose: Pokemon price depth, graded/raw values, eBay/CardMarket/TCGPlayer comparison.
   - Price seen: Pro Trader $19.99/month, 100,000 requests/month, reviewed access.
   - URL: https://poketrace.com/

3. TCGPlayer API / Partner access
   - Purpose: direct US market prices and seller/listing flow.
   - URL: https://docs.tcgplayer.com/reference/pricing

## Product Rule

Never add a scanned card to the collection unless exact print evidence is verified:

- card name
- printed card number
- set id/name or printed total
- rarity/foil cues when visible
- provider confidence, or second provider agreement

If the result is uncertain, show candidates but keep "add to collection" locked.
