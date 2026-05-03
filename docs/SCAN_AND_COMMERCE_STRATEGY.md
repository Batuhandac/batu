# Cardory Scan and Commerce Strategy

## Non-Negotiable Scan Goal

Cardory must optimize for exact physical printing, not character recognition.

For Pokemon, One Piece, and Naruto this means:
- game
- card name
- set or product line
- printed card number/code
- rarity
- finish/variant when visible, such as holo, reverse holo, parallel, promo, alt art
- condition as a separate user-confirmed inventory field

The practical target is not "always auto-accept." The target is "never silently add the wrong card." A scan can be:
- `verified`: exact provider identity plus catalog validation agree
- `needs_review`: likely match, but exact printing is ambiguous
- `unidentified`: no safe match

Only `verified` should be one-tap add. `needs_review` must show alternatives.

## Provider Recommendation

### Pokemon

Primary scanner: GiblTCG Vision API.

Why:
- dedicated card identification endpoint
- returns card type, card side/state, identity candidates, and confidence
- supports graded/slab detection
- claims multi-card image handling and skew/glare resistance

Catalog and price:
- Scrydex for Pokemon catalog, raw prices, graded prices, history, and trend data
- PokemonTCG.io remains useful as a fallback catalog, but it is not enough for our paid SaaS positioning
- TCGPlayer direct can be used later for seller/store accounts

Decision: buy or trial GiblTCG first, buy Scrydex Growth if price/history and multi-game catalog become core immediately.

### One Piece

Primary scanner: GiblTCG Vision API, validated against One Piece catalog.

Catalog and price:
- One Piece Card Game API is strong and inexpensive for One Piece market data, with Cardmarket and TCGPlayer pricing
- Scrydex can be the unified multi-game source if we prefer one vendor
- OPTCG API is useful as a free fallback catalog, but it should not be the commercial source of truth

Decision: use GiblTCG for image identity and One Piece Card Game API or Scrydex for exact card data/prices.

### Naruto

Primary scanner: GiblTCG or vision-assisted OCR, but only with a Cardory-owned catalog.

Problem:
- Naruto has no mature global commercial API comparable to Pokemon or One Piece
- Kayou and older Naruto TCG printings have fragmented catalogs, regional products, reused characters, and rarity tiers

Decision:
- build our own Naruto catalog table with card code, wave/tier, rarity, images, and source confidence
- use GiblTCG/vision only as candidate generation
- require review unless exact code plus rarity/product line are validated against our catalog

## Accuracy Measurement

We need a fixture corpus before claiming product-grade accuracy.

Minimum launch corpus:
- 150 Pokemon photos across common, rare, holo, reverse holo, promo, full art, alt art, vintage, Japanese if supported
- 100 One Piece photos across leaders, characters, events, stages, promos, parallels
- 100 Naruto photos across Kayou tiers/waves and older Naruto TCG if we support it

For each fixture, store:
- image file
- expected game
- expected exact card key
- expected name
- expected set/code
- expected rarity/finish
- notes about glare, sleeve, slab, crop, language

Required metrics:
- exact print accuracy
- wrong auto-accept count
- needs-review rate
- unidentified rate
- latency p50/p95
- cost per verified scan

Launch gate:
- 0 silent wrong auto-adds in the corpus
- at least 98% verified or needs-review for Pokemon and One Piece
- Naruto can launch as beta only if exact-code catalog coverage is incomplete

## Commercial Product Wedge

The money-making flow is:
1. scan cards into trustworthy inventory
2. price and track value
3. show set completion gaps
4. match collectors by duplicate/missing cards
5. help shops sync inventory to selling channels

Consumer side:
- collection tracker
- set completion dashboard
- friend trade matching
- "you have 2, friend has 0" opportunities
- wishlist and missing-card alerts
- local Turkish collector marketplace/community

Shop/SaaS side:
- high-volume scan
- inventory and condition management
- buylist intake
- price rules in TRY/USD/EUR
- Shopify/eBay/TCGPlayer/Cardmarket-style channel sync
- POS and order decrement later

Turkey-first advantage:
- Turkish language UX
- TRY valuation beside USD/EUR
- local collector/store discovery
- domestic trade and marketplace flows
- imported card price visibility and arbitrage signals

Global advantage:
- exact scan and duplicate/missing matching are universal
- collector social graph can grow before full marketplace integrations
- shops can pay for inventory automation and sync
