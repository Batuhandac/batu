import {
  applyCors,
  fetchJson,
  getBody,
  missingCredentialResponse,
  money,
  rejectNonPost,
  text,
} from '../_integration-utils.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectNonPost(req, res)) return;

  const { config = {}, listing = {}, dryRun } = getBody(req);
  const baseUrl = config.sandbox || process.env.EBAY_SANDBOX === '1'
    ? 'https://api.sandbox.ebay.com'
    : 'https://api.ebay.com';

  const accessToken = process.env.EBAY_SELL_ACCESS_TOKEN ?? '';
  const marketplaceId = config.marketplaceId ?? process.env.EBAY_MARKETPLACE_ID ?? 'EBAY_US';
  const merchantLocationKey = config.merchantLocationKey ?? process.env.EBAY_MERCHANT_LOCATION_KEY ?? '';
  const categoryId = config.categoryId ?? process.env.EBAY_CATEGORY_ID ?? '';
  const fulfillmentPolicyId = config.fulfillmentPolicyId ?? process.env.EBAY_FULFILLMENT_POLICY_ID ?? '';
  const paymentPolicyId = config.paymentPolicyId ?? process.env.EBAY_PAYMENT_POLICY_ID ?? '';
  const returnPolicyId = config.returnPolicyId ?? process.env.EBAY_RETURN_POLICY_ID ?? '';

  const sku = text(listing.sku, listing.card?.apiId ?? listing.card?.id ?? 'CARDORY-SKU');
  const inventoryPayload = buildInventoryItem(listing, sku);
  const offerPayload = buildOffer({
    listing,
    sku,
    marketplaceId,
    merchantLocationKey,
    categoryId,
    fulfillmentPolicyId,
    paymentPolicyId,
    returnPolicyId,
  });

  const required = [];
  if (!accessToken) required.push('EBAY_SELL_ACCESS_TOKEN');
  if (!merchantLocationKey) required.push('EBAY_MERCHANT_LOCATION_KEY');
  if (!categoryId) required.push('EBAY_CATEGORY_ID');
  if (!fulfillmentPolicyId) required.push('EBAY_FULFILLMENT_POLICY_ID');
  if (!paymentPolicyId) required.push('EBAY_PAYMENT_POLICY_ID');
  if (!returnPolicyId) required.push('EBAY_RETURN_POLICY_ID');

  if (dryRun || required.length) {
    return missingCredentialResponse(res, 'ebay', required, {
      inventoryItem: inventoryPayload,
      offer: offerPayload,
      publish: { method: 'POST', url: `${baseUrl}/sell/inventory/v1/offer/{offerId}/publish` },
    });
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Content-Language': 'en-US',
    'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
  };

  const inventory = await fetchJson(`${baseUrl}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(inventoryPayload),
  });
  if (!inventory.ok) {
    return res.status(inventory.status).json({ success: false, channel: 'ebay', step: 'inventory_item', error: inventory.data });
  }

  const offer = await fetchJson(`${baseUrl}/sell/inventory/v1/offer`, {
    method: 'POST',
    headers,
    body: JSON.stringify(offerPayload),
  });
  if (!offer.ok) {
    return res.status(offer.status).json({ success: false, channel: 'ebay', step: 'create_offer', error: offer.data });
  }

  const offerId = offer.data?.offerId;
  if (!offerId) {
    return res.status(502).json({ success: false, channel: 'ebay', step: 'create_offer', error: 'offerId_missing', raw: offer.data });
  }

  const publish = await fetchJson(`${baseUrl}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!publish.ok) {
    return res.status(publish.status).json({ success: false, channel: 'ebay', step: 'publish_offer', offerId, error: publish.data });
  }

  return res.status(200).json({
    success: true,
    channel: 'ebay',
    externalId: publish.data?.listingId ?? offerId,
    offerId,
    raw: { offer: offer.data, publish: publish.data },
  });
}

function buildInventoryItem(listing, sku) {
  const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : [];
  const product = {
    title: text(listing.title, listing.card?.name ?? 'Trading card').slice(0, 80),
    description: text(listing.description, ''),
    imageUrls,
    aspects: {
      Game: [text(listing.metadata?.game, listing.card?.game ?? 'TCG')],
      Set: [text(listing.metadata?.setName, listing.card?.setName ?? '')],
      Rarity: [text(listing.metadata?.rarity, listing.card?.rarity ?? '')],
      'Card Number': [text(listing.metadata?.number, listing.card?.number ?? '')],
      Brand: [text(listing.metadata?.game, listing.card?.game ?? 'Trading Card Game')],
    },
  };

  Object.keys(product.aspects).forEach((key) => {
    product.aspects[key] = product.aspects[key].filter(Boolean);
    if (!product.aspects[key].length) delete product.aspects[key];
  });

  return {
    availability: {
      shipToLocationAvailability: { quantity: Math.max(1, Number(listing.quantity ?? 1)) },
    },
    condition: mapEbayCondition(listing.condition),
    product,
  };
}

function buildOffer({
  listing,
  sku,
  marketplaceId,
  merchantLocationKey,
  categoryId,
  fulfillmentPolicyId,
  paymentPolicyId,
  returnPolicyId,
}) {
  return {
    sku,
    marketplaceId,
    format: 'FIXED_PRICE',
    availableQuantity: Math.max(1, Number(listing.quantity ?? 1)),
    categoryId,
    merchantLocationKey,
    listingDescription: text(listing.description, '').replace(/\n/g, '<br />'),
    listingPolicies: {
      fulfillmentPolicyId,
      paymentPolicyId,
      returnPolicyId,
    },
    pricingSummary: {
      price: {
        currency: text(listing.currency, 'USD'),
        value: money(listing.price).toFixed(2),
      },
    },
    includeCatalogProductDetails: false,
  };
}

function mapEbayCondition(condition) {
  const map = {
    NM: 'LIKE_NEW',
    LP: 'VERY_GOOD',
    MP: 'GOOD',
    HP: 'ACCEPTABLE',
    DMG: 'FOR_PARTS_OR_NOT_WORKING',
  };
  return map[condition] ?? 'USED_EXCELLENT';
}
