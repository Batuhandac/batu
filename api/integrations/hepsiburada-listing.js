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

const PRODUCT_BASE = process.env.HEPSIBURADA_PRODUCT_BASE_URL ?? 'https://mpop.hepsiburada.com';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectNonPost(req, res)) return;

  const { config = {}, listing = {}, dryRun } = getBody(req);
  const merchantId = config.merchantId ?? process.env.HEPSIBURADA_MERCHANT_ID ?? '';
  const username = process.env.HEPSIBURADA_USERNAME ?? '';
  const password = process.env.HEPSIBURADA_PASSWORD ?? '';
  const payload = [buildCatalogItem(listing, config, merchantId)];
  const endpoint = `${PRODUCT_BASE}/product/api/products/import`;

  const required = [];
  if (!merchantId) required.push('HEPSIBURADA_MERCHANT_ID');
  if (!username) required.push('HEPSIBURADA_USERNAME');
  if (!password) required.push('HEPSIBURADA_PASSWORD');
  if (!config.categoryId && !process.env.HEPSIBURADA_CATEGORY_ID) required.push('HEPSIBURADA_CATEGORY_ID');

  if (dryRun || required.length) {
    return missingCredentialResponse(res, 'hepsiburada', required, {
      method: 'POST',
      url: endpoint,
      file: 'integrator.json',
      payload,
    });
  }

  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'integrator.json');

  const result = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(username, password)}`,
    },
    body: form,
  });

  if (!result.ok) {
    return res.status(result.status).json({ success: false, channel: 'hepsiburada', error: result.data });
  }

  return res.status(200).json({
    success: true,
    channel: 'hepsiburada',
    externalId: result.data?.trackingId ?? result.data?.id,
    raw: result.data,
  });
}

function buildCatalogItem(listing, config, merchantId) {
  const sku = text(listing.sku, listing.card?.apiId ?? listing.card?.id ?? 'CARDORY-SKU');
  const barcode = text(listing.barcode, sku);

  return {
    categoryId: Number(config.categoryId ?? process.env.HEPSIBURADA_CATEGORY_ID ?? 0),
    merchant: merchantId,
    attributes: {
      merchantSku: sku,
      VaryantGroupID: text(listing.productMainId, sku),
      Barcode: barcode,
      UrunAdi: text(listing.title, listing.card?.name ?? 'Trading card'),
      UrunAciklamasi: text(listing.description, ''),
      Marka: text(config.brand, listing.metadata?.game ?? listing.card?.game ?? 'Cardory'),
      GarantiSuresi: Number(config.warrantyMonths ?? 0),
      kg: Number(config.weightKg ?? 1),
      price: money(listing.price),
      stock: Math.max(1, Number(listing.quantity ?? 1)),
      images: (listing.imageUrls ?? []).filter(Boolean).slice(0, 8),
      ...Object.fromEntries(
        Object.entries(listing.metadata ?? {}).map(([key, value]) => [`Cardory_${key}`, String(value ?? '')]),
      ),
    },
  };
}
