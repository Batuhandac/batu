import { ChannelConfig, ChannelType, ListingPush } from '@/types';
import { supabase } from '@/lib/supabase';
import { postServerApi } from '@/lib/api/serverApi';

export interface PushResult {
  success: boolean;
  externalId?: string;
  error?: string;
  dryRun?: boolean;
  required?: string[];
}

type LegacyListing = ListingPush & {
  card: { id?: string; apiId?: string; name: string; imageUrl: string; setName: string; number: string; game?: string; rarity?: string };
};

const CHANNEL_ENDPOINTS: Record<ChannelType, string> = {
  shopify: '/api/integrations/shopify-listing',
  ikas: '/api/integrations/ikas-listing',
  ebay: '/api/integrations/ebay-publish',
  trendyol: '/api/integrations/trendyol-listing',
  hepsiburada: '/api/integrations/hepsiburada-listing',
};

export async function pushToShopify(config: ChannelConfig, listing: LegacyListing): Promise<PushResult> {
  return pushToChannel('shopify', config, listing);
}

export async function pushToIkas(config: ChannelConfig, listing: LegacyListing): Promise<PushResult> {
  return pushToChannel('ikas', config, listing);
}

export async function pushToEbay(config: ChannelConfig, listing: LegacyListing): Promise<PushResult> {
  return pushToChannel('ebay', config, listing);
}

export async function pushToTrendyol(config: ChannelConfig, listing: LegacyListing): Promise<PushResult> {
  return pushToChannel('trendyol', config, listing);
}

export async function pushToHepsiburada(config: ChannelConfig, listing: LegacyListing): Promise<PushResult> {
  return pushToChannel('hepsiburada', config, listing);
}

export async function pushToChannel(
  channel: ChannelType,
  config: ChannelConfig,
  listing: LegacyListing,
): Promise<PushResult> {
  const response = await postServerApi<PushResult>(
    CHANNEL_ENDPOINTS[channel],
    {
      channelId: config.id,
      config: publicConfig(config),
      listing: normalizeListing(listing),
    },
  );

  if (!response.ok) {
    return { success: false, error: response.reason, dryRun: response.reason === 'not_configured' };
  }

  return response.data;
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

function publicConfig(config: ChannelConfig): Partial<ChannelConfig> {
  return {
    id: config.id,
    userId: config.userId,
    type: config.type,
    name: config.name,
    storeUrl: config.storeUrl,
    isActive: config.isActive,
    lastSyncAt: config.lastSyncAt,
  };
}

function normalizeListing(listing: LegacyListing) {
  const title = listing.title ?? `${listing.card.name} - ${listing.card.setName} #${listing.card.number}`;
  const description = listing.description ?? [
    listing.card.name,
    listing.card.setName ? `Set: ${listing.card.setName}` : '',
    listing.card.number ? `Card Number: ${listing.card.number}` : '',
    listing.card.rarity ? `Rarity: ${listing.card.rarity}` : '',
  ].filter(Boolean).join('\n');

  return {
    userCardId: listing.userCardId,
    sku: [listing.card.game, listing.card.apiId ?? listing.card.id, listing.card.number]
      .filter(Boolean)
      .join('-')
      .toUpperCase(),
    title,
    description,
    price: listing.price,
    currency: listing.currency,
    quantity: 1,
    condition: 'NM',
    imageUrls: listing.card.imageUrl ? [listing.card.imageUrl] : [],
    tags: [listing.card.game, listing.card.setName, listing.card.rarity].filter(Boolean),
    productType: `TCG Single - ${listing.card.game ?? 'card'}`,
    metadata: {
      game: listing.card.game ?? '',
      setName: listing.card.setName,
      number: listing.card.number,
      rarity: listing.card.rarity ?? '',
      source: 'cardory',
    },
    card: listing.card,
  };
}
