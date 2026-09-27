import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { Text, Icon } from '@/components/ds';
import { PetFace, usePastel } from '@/components/art';
import { useTheme, radius } from '@/lib/theme';
import { pastelOf } from '@/lib/art/faces';
import { track } from '@/lib/analytics';
import type { Banner } from '@/lib/content/banners';

export function openBanner(b: Banner) {
  track('banner_tap', { id: b.id });
  if (b.route) router.push(b.route as never);
  else if (b.url) Linking.openURL(b.url).catch(() => {});
}

/** Duyuru kartı: pastel zemin, kısa başlık, bir cümle, bir bağlantı; köşeden bakan maskot. */
export function BannerCard({ banner }: { banner: Banner }) {
  const t = useTheme();
  const bg = usePastel(banner.color ?? pastelOf(banner.id));
  return (
    <Pressable
      onPress={() => openBanner(banner)}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}. ${banner.text}`}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 140,
        borderRadius: radius.lg,
        backgroundColor: bg,
        padding: 16,
        paddingRight: banner.mascot ? 100 : 16,
        justifyContent: 'space-between',
        overflow: 'hidden',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View>
        {banner.tag ? (
          <Text variant="overline" tone="muted" style={{ marginBottom: 4 }}>
            {banner.tag}
          </Text>
        ) : null}
        <Text variant="bodyStrong" numberOfLines={2}>
          {banner.title}
        </Text>
        <Text variant="callout" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
          {banner.text}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 10 }}>
        <Text variant="callout" tone="primary" style={{ fontWeight: '600' }}>
          {banner.cta}
        </Text>
        <Icon name="chevron-forward" size={15} color={t.primary} />
      </View>
      {banner.mascot ? (
        <View style={{ position: 'absolute', right: 4, bottom: -18 }}>
          <PetFace species={banner.mascot} mood={banner.mood} seed={banner.id} size={104} />
        </View>
      ) : null}
    </Pressable>
  );
}
