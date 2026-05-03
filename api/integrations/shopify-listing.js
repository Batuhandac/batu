import {
  applyCors,
  fetchJson,
  getBody,
  missingCredentialResponse,
  money,
  normalizeShopDomain,
  rejectNonPost,
  text,
} from '../_integration-utils.js';

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2026-04';

const PRODUCT_SET_MUTATION = `
  mutation CardoryProductSet($productSet: ProductSetInput!, $synchronous: Boolean!) {
    productSet(input: $productSet, synchronous: $synchronous) {
      product {
        id
        title
        variants(first: 5) {
          nodes {
            id
            title
            price
          }
        }
      }
      productSetOperation {
        id
        status
        userErrors {
          code
          field
          message
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectNonPost(req, res)) return;

  const { config = {}, listing = {}, dryRun } = getBody(req);
  const payload = buildShopifyProductSet(listing);
  const shop = normalizeShopDomain(
    process.env.SHOPIFY_STORE_DOMAIN ?? config.storeDomain ?? config.storeUrl,
  );
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? '';

  if (dryRun || !shop || !accessToken) {
    const required = [];
    if (!shop) required.push('SHOPIFY_STORE_DOMAIN');
    if (!accessToken) required.push('SHOPIFY_ADMIN_ACCESS_TOKEN');
    return missingCredentialResponse(res, 'shopify', required, payload);
  }

  const result = await fetchJson(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: PRODUCT_SET_MUTATION,
      variables: {
        synchronous: true,
        productSet: payload,
      },
    }),
  });

  if (!result.ok) {
    return res.status(result.status).json({ success: false, channel: 'shopify', error: result.data });
  }

  const data = result.data?.data?.productSet;
  const userErrors = [
    ...(data?.userErrors ?? []),
    ...(data?.productSetOperation?.userErrors ?? []),
  ].filter(Boolean);

  if (userErrors.length) {
    return res.status(200).json({ success: false, channel: 'shopify', errors: userErrors, raw: result.data });
  }

  return res.status(200).json({
    success: true,
    channel: 'shopify',
    externalId: data?.product?.id ?? data?.productSetOperation?.id,
    raw: result.data,
  });
}

function buildShopifyProductSet(listing) {
  const imageUrl = listing.imageUrls?.[0] ?? listing.card?.imageUrl;
  const condition = text(listing.condition, 'Single');
  const price = money(listing.price);
  const sku = text(listing.sku, listing.card?.apiId ?? listing.card?.id ?? 'CARDORY-SKU');

  const productSet = {
    title: text(listing.title, listing.card?.name ?? 'Trading card'),
    descriptionHtml: text(listing.description, '').replace(/\n/g, '<br />'),
    productType: text(listing.productType, `TCG Single - ${listing.card?.game ?? 'card'}`),
    vendor: 'Cardory',
    tags: Array.isArray(listing.tags) ? listing.tags : ['tcg', listing.card?.game].filter(Boolean),
    productOptions: [
      {
        name: 'Condition',
        position: 1,
        values: [{ name: condition }],
      },
    ],
    variants: [
      {
        optionValues: [{ optionName: 'Condition', name: condition }],
        price,
        sku,
      },
    ],
    metafields: Object.entries(listing.metadata ?? {}).map(([key, value]) => ({
      namespace: 'cardory',
      key,
      value: String(value ?? ''),
      type: 'single_line_text_field',
    })),
  };

  if (imageUrl) {
    productSet.files = [
      {
        originalSource: imageUrl,
        alt: productSet.title,
        filename: `${sku.toLowerCase()}.jpg`,
        contentType: 'IMAGE',
      },
    ];
    productSet.variants[0].file = productSet.files[0];
  }

  return productSet;
}
