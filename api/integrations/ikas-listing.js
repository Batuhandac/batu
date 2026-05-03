import {
  applyCors,
  fetchJson,
  getBody,
  missingCredentialResponse,
  money,
  rejectNonPost,
  text,
} from '../_integration-utils.js';

const DEFAULT_API_URL = 'https://api.myikas.com/api/v1/admin/graphql';

const CREATE_PRODUCT_MUTATION = `
  mutation CardoryCreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
    }
  }
`;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectNonPost(req, res)) return;

  const { config = {}, listing = {}, dryRun } = getBody(req);
  const apiUrl = process.env.IKAS_ADMIN_API_URL ?? config.apiUrl ?? DEFAULT_API_URL;
  const accessToken = process.env.IKAS_ADMIN_ACCESS_TOKEN ?? '';
  const payload = buildIkasInput(listing);

  const required = [];
  if (!accessToken) required.push('IKAS_ADMIN_ACCESS_TOKEN');
  if (!apiUrl) required.push('IKAS_ADMIN_API_URL');

  if (dryRun || required.length) {
    return missingCredentialResponse(res, 'ikas', required, {
      query: CREATE_PRODUCT_MUTATION,
      variables: { input: payload },
    });
  }

  const result = await fetchJson(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: CREATE_PRODUCT_MUTATION,
      variables: { input: payload },
    }),
  });

  if (!result.ok) {
    return res.status(result.status).json({ success: false, channel: 'ikas', error: result.data });
  }

  const errors = result.data?.errors ?? [];
  if (errors.length) {
    return res.status(200).json({ success: false, channel: 'ikas', errors, raw: result.data });
  }

  const product = result.data?.data?.createProduct;
  return res.status(200).json({
    success: true,
    channel: 'ikas',
    externalId: product?.id,
    raw: result.data,
  });
}

function buildIkasInput(listing) {
  return {
    name: text(listing.title, listing.card?.name ?? 'Trading card'),
    description: text(listing.description, ''),
    type: 'PHYSICAL',
    salesPrice: money(listing.price),
    currency: text(listing.currency, 'TRY'),
    sku: text(listing.sku, listing.card?.apiId ?? listing.card?.id ?? 'CARDORY-SKU'),
    stock: Math.max(1, Number(listing.quantity ?? 1)),
    images: Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : [],
    attributes: Object.entries(listing.metadata ?? {}).map(([name, value]) => ({
      name,
      value: String(value ?? ''),
    })),
  };
}
