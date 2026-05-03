# Cardory Feature Blueprint

## Core Promise

Scan any supported card, identify the exact physical printing, price it, add it to inventory, show set completion, and let the owner either sell it everywhere or trade it with the right collector.

## Product Loops

### Collector Loop

1. Scan card.
2. Exact card is verified or alternatives are shown.
3. Card enters collection with condition, finish, quantity, and purchase cost.
4. Set completion updates instantly.
5. Missing cards and duplicate cards become visible.
6. Cardory matches collectors whose duplicates fill each other's gaps.
7. Users trade physically, then confirm completion.

### Seller Loop

1. Scan cards in bulk.
2. Cardory builds inventory with exact card data, image, condition, SKU, and price.
3. Seller applies currency, FX, markup, fee, and rounding rules.
4. Cardory publishes products/listings to Shopify, ikas, eBay, and later TCGPlayer/Cardmarket.
5. Orders decrement one source of truth.
6. Repricing updates listings when market values move.

## Features That Can Make This Big

- Exact-print scan with zero silent wrong auto-adds.
- Personal collection vault.
- Set completion for Pokemon, One Piece, Naruto, and later more TCGs.
- Wishlist and missing-card alerts.
- Duplicate-card detection.
- Collector trade matching.
- Local Turkish collector/store discovery.
- TRY/USD/EUR pricing with configurable FX and margin.
- Shop inventory management.
- Marketplace publishing to Shopify, ikas, eBay.
- Buylist intake for shops.
- Price history and arbitrage alerts.
- Consignment mode for stores selling collector inventory.
- Event/trade night mode for local shops.
- Graded slab tracking and portfolio value.
- Bulk scan queue for stores.
- CSV import/export for legacy inventory.
- Fraud/confidence flags for risky scans.
- API/webhooks for shop integrations.

## Launch Scope

Phase 1:
- Pokemon and One Piece exact scan with GiblTCG.
- Naruto beta with manual review unless exact code catalog exists.
- Collection, quantity, condition, finish.
- Set completion.
- Duplicate/missing matching.
- TRY pricing rule.

Phase 2:
- Shopify and ikas product push.
- eBay inventory item payload/export, then OAuth publish.
- Order ingest and stock reservation.
- Price refresh jobs.

Phase 3:
- Storefront/POS, buylist, events, consignment, TCGPlayer/Cardmarket style sync.

## Integration Notes

Shopify:
- Product data goes to Admin API.
- SKU belongs to variant/inventory item.
- We generate title, description, image, tags, metafields, price, and inventory quantity.

eBay:
- Inventory item must exist before an offer is published.
- SKU is seller-defined and must be unique.
- Offer publish requires marketplace, category, business policies, price, and quantity.

ikas:
- Treat as product catalog plus stock/price/image sync.
- Keep our canonical inventory ID and SKU as the stable mapping key.

Competitor signal:
- TCG Sync sells unified inventory, POS, buylist, events, Shopify, eBay, TCGPlayer, Cardmarket, and marketplace sync.
- SortSwift positions around inventory, POS, buylist, scanning, syncing, autopricing, and hardware.
- Synq focuses on Shopify card creation and daily market price sync.
