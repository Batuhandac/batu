import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { Text, Icon } from '@/components/ds';
import { Art } from '@/components/art';
import { useTheme, radius, palette } from '@/lib/theme';
import { track } from '@/lib/analytics';
import type { Banner, BannerTone } from '@/lib/content/banners';

function toneColors(tone: BannerTone, dark: boolean) {
  switch (tone) {
    case 'coral':
      return { bg: palette.coral[600], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.88)', tagBg: 'rgba(255,255,255,0.2)', ctaBg: '#FFFFFF', ctaFg: palette.coral[700], onColor: true };
    case 'honey':
      return dark
        ? { bg: '#2A2416', fg: '#F3F0EA', sub: '#C9C2B4', tagBg: 'rgba(233,169,58,0.2)', ctaBg: palette.honey[500], ctaFg: palette.night[900], onColor: false }
        : { bg: palette.honey[100], fg: palette.ink[900], sub: palette.ink[700], tagBg: 'rgba(183,121,26,0.14)', ctaBg: palette.ink[900], ctaFg: '#FFFFFF', onColor: false };
    case 'night':
      return { bg: dark ? palette.night[700] : palette.ink[900], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.75)', tagBg: 'rgba(63,184,165,0.22)', ctaBg: palette.teal[400], ctaFg: palette.night[900], onColor: false, darkArt: true };
    default:
      return { bg: palette.teal[700], fg: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', tagBg: 'rgba(255,255,255,0.18)', ctaBg: '#FFFFFF', ctaFg: palette.teal[700], onColor: true };
  }
}

export function openBanner(b: Banner) {
  track('banner_tap', { id: b.id });
  if (b.route) router.push(b.route as never);
  else if (b.url) Linking.openURL(b.url).catch(() => {});
}

export function BannerCard({ banner }: { banner: Banner }) {
  const t = useTheme();
  const c = toneColors(banner.tone, t.dark);
  return (
    <Pressable
      onPress={() => openBanner(banner)}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}. ${banner.text}`}
      style={({ pressed }) => ({
        height: 176,
        borderRadius: radius.xl,
        backgroundColor: c.bg,
        overflow: 'hidden',
        flexDirection: 'row',
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={{ flex: 1, padding: 18, paddingRight: 0, justifyContent: 'space-between' }}>
        <View>
          {banner.tag ? (
            <View style={{ alignSelf: 'flex-start', backgroundColor: c.tagBg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 8 }}>
              <Text variant="overline" color={c.fg} style={{ fontSize: 10.5, letterSpacing: 0.6 }}>
                {banner.tag}
              </Text>
            </View>
          ) : null}
          <Text variant="headline" color={c.fg} numberOfLines={2} style={{ fontSize: 18, lineHeight: 23 }}>
            {banner.title}
          </Text>
          <Text variant="caption" color={c.sub} numberOfLines={2} style={{ marginTop: 4 }}>
            {banner.text}
          </Text>
        </View>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: c.ctaBg,
            borderRadius: radius.pill,
            paddingHorizontal: 14,
            height: 34,
          }}
        >
          <Text variant="caption" color={c.ctaFg} style={{ fontSize: 13.5 }}>
            {banner.cta}
          </Text>
          <Icon name="arrow-forward" size={15} color={c.ctaFg} />
        </View>
      </View>
      <View style={{ width: 128, justifyContent: 'center', alignItems: 'center', marginRight: -6 }}>
        <Art name={banner.art} width={150} onColor={c.onColor} dark={'darkArt' in c ? c.darkArt : undefined} />
      </View>
    </Pressable>
  );
}
