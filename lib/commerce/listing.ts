import { ChannelType, UserCard } from '@/types';
import { DEFAULT_TRY_PRICING_RULE, PricingRule, priceForSale } from './pricing';

export interface ChannelListing {
  channel: ChannelType;
  sku: string;
  title: string;
  description: string;
  quantity: number;
  price: number;
  currency: string;
  imageUrls: string[];
  tags: string[];
  condition: string;
  productType: string;
  metadata: Record<string, string>;
  payload: unknown;
}

export function buildSku(userCard: UserCard): string {
  const card = userCard.card;
  return [
    card.game,
    card.setCode,
    card.number,
    card.rarity,
    userCard.condition,
    userCard.foil ? 'foil' : 'normal',
    userCard.id.slice(0, 8),
  ].map(slug).filter(Boolean).join('-').toUpperCase();
}

export function buildListingTitle(userCard: UserCard): string {
  const card = userCard.card;
  const finish = userCard.foil ? 'Foil' : 'Non-Foil';
  const number = card.number ? `#${card.number}` : '';
  return [card.name, card.setName, number, card.rarity, userCard.condition, finish]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 140);
}

export function buildListingDescription(userCard: UserCard): string {
  const card = userCard.card;
  return [
    `${card.name}`,
    `Game: ${card.game}`,
    card.setName ? `Set: ${card.setName}` : '',
    card.number ? `Card Number: ${card.number}` : '',
    card.rarity ? `Rarity: ${card.rarity}` : '',
    `Condition: ${userCard.condition}`,
    `Finish: ${userCard.foil ? 'Foil' : 'Non-Foil'}`,
    userCard.notes ? `Notes: ${userCard.notes}` : '',
  ].filter(Boolean).join('\n');
}

export function buildChannelListing(
  userCard: UserCard,
  channel: ChannelListing['channel'],
  rule: PricingRule = DEFAULT_TRY_PRICING_RULE,
): ChannelListing {
  const priced = priceForSale(userCard, rule);
  const sku = buildSku(userCard);
  const title = buildListingTitle(userCard);
  const description = buildListingDescription(userCard);

  const base: Omit<ChannelListing, 'payload'> = {
    channel,
    sku,
    title,
    description,
    quantity: userCard.quantity,
    price: priced.amount,
    currency: priced.currency,
    imageUrls: userCard.card.imageUrl ? [userCard.card.imageUrl] : [],
    tags: [userCard.card.game, userCard.card.setCode, userCard.card.rarity, userCard.condition].filter(Boolean),
    condition: userCard.condition,
    productType: `TCG Single - ${userCard.card.game}`,
    metadata: {
      game: userCard.card.game,
      apiId: userCard.card.apiId,
      setCode: userCard.card.setCode,
      setName: userCard.card.setName,
      number: userCard.card.number,
      rarity: userCard.card.rarity,
      finish: userCard.foil ? 'foil' : 'normal',
    },
  };

  return { ...base, payload: buildPayload(base) };
}

function buildPayload(listing: Omit<ChannelListing, 'payload'>): unknown {
  switch (listing.channel) {
    case 'shopify':
      return {
        productSet: {
          title: listing.title,
          descriptionHtml: listing.description.replace(/\n/g, '<br />'),
          productType: listing.productType,
          vendor: 'Cardory',
          tags: listing.tags.join(', '),
          productOptions: [{ name: 'Condition', position: 1, values: [{ name: listing.condition }] }],
          files: listing.imageUrls.map((src) => ({
            originalSource: src,
            alt: listing.title,
            filename: `${listing.sku.toLowerCase()}.jpg`,
            contentType: 'IMAGE',
          })),
          variants: [
            {
              optionValues: [{ optionName: 'Condition', name: listing.condition }],
              sku: listing.sku,
              price: listing.price,
              file: listing.imageUrls[0]
                ? {
                    originalSource: listing.imageUrls[0],
                    alt: listing.title,
                    filename: `${listing.sku.toLowerCase()}.jpg`,
                    contentType: 'IMAGE',
                  }
                : undefined,
            },
          ],
          metafields: Object.entries(listing.metadata).map(([key, value]) => ({
            namespace: 'cardory',
            key,
            value,
            type: 'single_line_text_field',
          })),
        },
      };
    case 'ebay':
      return {
        inventoryItem: {
          sku: listing.sku,
          availability: {
            shipToLocationAvailability: { quantity: listing.quantity },
          },
          condition: mapEbayCondition(listing.condition),
          product: {
            title: listing.title.slice(0, 80),
            description: listing.description,
            imageUrls: listing.imageUrls,
            aspects: {
              Game: [listing.metadata.game],
              Set: [listing.metadata.setName],
              Rarity: [listing.metadata.rarity],
              'Card Number': [listing.metadata.number],
            },
          },
        },
        offer: {
          sku: listing.sku,
          format: 'FIXED_PRICE',
          availableQuantity: listing.quantity,
          listingDescription: listing.description.replace(/\n/g, '<br />'),
          pricingSummary: {
            price: { currency: listing.currency, value: listing.price.toFixed(2) },
          },
        },
      };
    case 'ikas':
      return {
        name: listing.title,
        description: listing.description,
        sku: listing.sku,
        type: 'PHYSICAL',
        salesPrice: listing.price,
        currency: listing.currency,
        stock: listing.quantity,
        images: listing.imageUrls,
        attributes: listing.metadata,
      };
    case 'trendyol':
      return {
        items: [
          {
            barcode: listing.sku,
            title: listing.title.slice(0, 100),
            productMainId: listing.sku,
            quantity: listing.quantity,
            stockCode: listing.sku,
            dimensionalWeight: 1,
            description: listing.description,
            currencyType: 'TRY',
            listPrice: listing.price,
            salePrice: listing.price,
            images: listing.imageUrls.map((url) => ({ url })),
            attributes: Object.entries(listing.metadata).map(([attributeName, attributeValue]) => ({
              attributeName,
              customAttributeValue: attributeValue,
            })),
          },
        ],
      };
    case 'hepsiburada':
      return [
        {
          attributes: {
            merchantSku: listing.sku,
            VaryantGroupID: listing.sku,
            Barcode: listing.sku,
            UrunAdi: listing.title,
            UrunAciklamasi: listing.description,
            Marka: listing.metadata.game,
            price: listing.price,
            stock: listing.quantity,
            images: listing.imageUrls,
          },
        },
      ];
    default:
      return {
        sku: listing.sku,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: listing.currency,
        quantity: listing.quantity,
        imageUrls: listing.imageUrls,
        metadata: listing.metadata,
      };
  }
}

function mapEbayCondition(condition: string): string {
  const map: Record<string, string> = {
    NM: 'LIKE_NEW',
    LP: 'VERY_GOOD',
    MP: 'GOOD',
    HP: 'ACCEPTABLE',
    DMG: 'FOR_PARTS_OR_NOT_WORKING',
  };
  return map[condition] ?? 'USED_EXCELLENT';
}

function slug(value: string): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
