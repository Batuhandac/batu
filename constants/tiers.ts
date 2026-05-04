import { Tier } from '@/types';

export const TIER_CONFIG: Record<Tier, {
  label: string;
  price: string;
  description: string;
  badgeVariant: string;
}> = {
  free: {
    label: 'Ücretsiz',
    price: '₺0/ay',
    description: 'Ayda 10 tarama, temel koleksiyon, set ve wishlist takibi.',
    badgeVariant: 'neutral',
  },
  premium: {
    label: 'Premium',
    price: '₺79/ay',
    description: 'Limitsiz tarama, gelişmiş analitik, fiyat alarmları, wishlist.',
    badgeVariant: 'primary',
  },
  pro_starter: {
    label: 'Pro Starter',
    price: '₺999/ay',
    description: 'Premium + ikas/Shopify entegrasyonu, temel dealer araçları.',
    badgeVariant: 'success',
  },
  pro_growth: {
    label: 'Pro Growth',
    price: '₺2499/ay',
    description: 'Pro Starter + eBay + çok mağaza + buylist aracı.',
    badgeVariant: 'success',
  },
  pro_enterprise: {
    label: 'Enterprise',
    price: 'Özel',
    description: 'Pro Growth + özel API + öncelikli destek.',
    badgeVariant: 'warning',
  },
};
