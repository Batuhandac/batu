import {
  applyCors,
  basicAuth,
  fetchJson,
  getBody,
  missingCredentialResponse,
  money,
  rejectNonPost,
  text,
} from '../_integration-utils.js';

const BASE_URL = process.env.TRENDYOL_BASE_URL ?? 'https://apigw.trendyol.com';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectNonPost(req, res)) return;

  const { config = {}, listing = {}, mode = 'create', dryRun } = getBody(req);
  const sellerId = config.sellerId ?? process.env.TRENDYOL_SELLER_ID ?? '';
  const apiKey = process.env.TRENDYOL_API_KEY ?? '';
  const apiSecret = process.env.TRENDYOL_API_SECRET ?? '';
  const productPayload = buildCreateProductsPayload(listing, config);
  const pricePayload = buildPriceInventoryPayload(listing);
  const payload = mode === 'price_inventory' ? pricePayload : productPayload;

  const required = [];
  if (!sellerId) required.push('TRENDYOL_SELLER_ID');
  if (!apiKey) required.push('TRENDYOL_API_KEY');
  if (!apiSecret) required.push('TRENDYOL_API_SECRET');
  if (mode !== 'price_inventory') {
    if (!config.brandId && !process.env.TRENDYOL_BRAND_ID) required.push('TRENDYOL_BRAND_ID');
    if (!config.categoryId && !process.env.TRENDYOL_CATEGORY_ID) required.push('TRENDYOL_CATEGORY_ID');
    if (!config.cargoCompanyId && !process.env.TRENDYOL_CARGO_COMPANY_ID) required.push('TRENDYOL_CARGO_COMPANY_ID');
  }

  const endpoint = mode === 'price_inventory'
    ? `${BASE_URL}/integration/inventory/sellers/${sellerId}/products/price-and-inventory`
    : `${BASE_URL}/integration/product/sellers/${sellerId}/products`;

  if (dryRun || required.length) {
    return missingCredentialResponse(res, 'trendyol', required, {
      method: 'POST',
      url: endpoint,
      payload,
    });
  }

  const result = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(apiKey, apiSecret)}`,
      'Content-Type': 'application/json',
      'User-Agent': `${sellerId} - CardoryIntegration`,
    },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return res.status(result.status).json({ success: false, channel: 'trendyol', mode, error: result.data });
  }

  return res.status(200).json({
    success: true,
    channel: 'trendyol',
    mode,
    externalId: result.data?.batchRequestId,
    raw: result.data,
  });
}

function buildCreateProductsPayload(listing, config) {
  const barcode = text(listing.barcode, listing.sku ?? listing.card?.apiId ?? 'CARDORY-BARCODE');
  const sku = text(listing.sku, barcode);
  const price = money(listing.price);

  return {
    items: [
      {
        barcode,
        title: text(listing.title, listing.card?.name ?? 'Trading card').slice(0, 100),
        productMainId: text(listing.productMainId, sku).slice(0, 40),
        brandId: Number(config.brandId ?? process.env.TRENDYOL_BRAND_ID ?? 0),
        categoryId: Number(config.categoryId ?? process.env.TRENDYOL_CATEGORY_ID ?? 0),
        quantity: Math.max(1, Number(listing.quantity ?? 1)),
        stockCode: sku,
        dimensionalWeight: Number(config.dimensionalWeight ?? 1),
        description: text(listing.description, ''),
        currencyType: 'TRY',
        listPrice: money(listing.listPrice, price),
        salePrice: price,
        vatRate: Number(config.vatRate ?? process.env.TRENDYOL_VAT_RATE ?? 20),
        cargoCompanyId: Number(config.cargoCompanyId ?? process.env.TRENDYOL_CARGO_COMPANY_ID ?? 0),
        shipmentAddressId: Number(config.shipmentAddressId ?? process.env.TRENDYOL_SHIPMENT_ADDRESS_ID ?? 0),
        returningAddressId: Number(config.returningAddressId ?? process.env.TRENDYOL_RETURNING_ADDRESS_ID ?? 0),
        images: (listing.imageUrls ?? []).filter(Boolean).slice(0, 8).map((url) => ({ url })),
        attributes: Object.entries(listing.metadata ?? {}).map(([attributeName, attributeValue]) => ({
          attributeName,
          customAttributeValue: String(attributeValue ?? ''),
        })),
      },
    ],
  };
}

function buildPriceInventoryPayload(listing) {
  const price = money(listing.price);

  return {
    items: [
      {
        barcode: text(listing.barcode, listing.sku ?? listing.card?.apiId ?? 'CARDORY-BARCODE'),
        quantity: Math.max(0, Number(listing.quantity ?? 1)),
        salePrice: price,
        listPrice: money(listing.listPrice, price),
      },
    ],
  };
}
