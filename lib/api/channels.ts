import { ChannelConfig, ChannelType, ListingPush } from '@/types';
import { supabase } from '@/lib/supabase';

export interface PushResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export async function pushToShopify(
  config: ChannelConfig,
  listing: ListingPush & { card: { name: string; imageUrl: string; setName: string; number: string } },
): Promise<PushResult> {
  try {
    const product = {
      product: {
        title: listing.title ?? `${listing.card.name} - ${listing.card.setName} #${listing.card.number}`,
        body_html: listing.description ?? '',
        images: [{ src: listing.card.imageUrl }],
        variants: [
          {
            price: listing.price.toString(),
            inventory_quantity: 1,
          },
        ],
      },
    };

    const response = await fetch(`${config.storeUrl}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };

    const data = await response.json();
    return { success: true, externalId: data.product.id.toString() };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function pushToIkas(
  config: ChannelConfig,
  listing: ListingPush & { card: { name: string; imageUrl: string; setName: string; number: string } },
): Promise<PushResult> {
  try {
    const mutation = `
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          product { id name }
        }
      }
    `;

    const response = await fetch(`${config.storeUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            name: listing.title ?? `${listing.card.name} - ${listing.card.setName}`,
            price: { sellPrice: listing.price, currency: listing.currency },
          },
        },
      }),
    });

    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };

    const data = await response.json();
    return {
      success: true,
      externalId: data?.data?.createProduct?.product?.id,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getUserChannels(userId: string): Promise<ChannelConfig[]> {
  const { data, error } = await supabase
    .from('channel_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as ChannelType,
    name: row.name,
    accessToken: row.access_token,
    storeUrl: row.store_url,
    isActive: row.is_active,
    lastSyncAt: row.last_sync_at,
  }));
}
