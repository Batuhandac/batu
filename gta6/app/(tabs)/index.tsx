import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Section } from '@/components/ui/Screen';
import { Card, PhotoTile, SectionTitle } from '@/components/ui/Card';
import { Countdown } from '@/components/Countdown';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { PHOTOS, PhotoKey } from '@/content/media';
import { REGIONS } from '@/content/regions';
import { YANIS_TILES } from '@/content/tiles';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useSettings((s) => s.lang);
  const bundle = useContent((s) => s.bundle);
  const tr = lang === 'tr';

  const v5 = bundle.cheats.filter((c) => c.game === 'gta5' && c.status === 'verified').length;
  const named = bundle.locations.filter((l) => l.status === 'verified').length;
  const countFor = (match: string[]) => bundle.locations.filter((l) => l.area && match.includes(l.area)).length;

  return (
    <Screen bleed>
      <View style={{ height: 500 + insets.top }}>
        <Image source={PHOTOS.duo} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: '36%', top: 0 }} />
        <LinearGradient colors={gradients.scrimTop} style={[styles.heroTop, { height: insets.top + 90 }]} />
        <LinearGradient colors={gradients.scrim} locations={[0.3, 0.68, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.topBar, { top: insets.top + 10 }]}>
          <View>
            <Text style={styles.wordmark}>LEONIDA <Text style={{ color: colors.primary }}>CODES</Text></Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={styles.pill} hitSlop={8} accessibilityLabel="settings">
            <Ionicons name="globe-outline" size={14} color={colors.text} />
            <Text style={styles.pillText}>{lang.toUpperCase()}</Text>
          </Pressable>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.eyebrow}>{STRINGS.countdown.until[lang]} · 19.11.2026</Text>
          <Countdown />
          <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rule} />
          <Text style={styles.tagline}>{tr ? 'Oyun Türkçe değil. Rehberin Türkçe.' : 'Verified cheats, mission tactics and the map of Leonida.'}</Text>
        </View>
      </View>

      <Section style={{ marginTop: spacing.sm }}>
        <View style={styles.grid}>
          <PhotoTile photo="chase" title={STRINGS.tabs.cheats[lang]} caption={tr ? `${v5} doğrulanmış kod` : `${v5} verified codes`} onPress={() => router.push('/cheats')} style={styles.half} height={170} />
          <PhotoTile photo="heist" title={STRINGS.tabs.missions[lang]} caption={tr ? 'Altın madalya · atlama' : 'Gold medals · skips'} onPress={() => router.push('/missions')} style={styles.half} height={170} />
        </View>
        <Pressable onPress={() => router.push('/map')} style={({ pressed }) => [styles.mapTile, pressed && { opacity: 0.88 }]}>
          <Image source={YANIS_TILES['1_0_0']} style={styles.mapImg} contentFit="cover" contentPosition={{ right: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(7,5,13,0.92)', 'rgba(7,5,13,0.35)', 'rgba(7,5,13,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.mapText}>
            <Text style={styles.mapEyebrow}>{tr ? 'İNTERAKTİF' : 'INTERACTIVE'}</Text>
            <Text style={styles.mapTitle}>{tr ? 'Leonida\nHaritası' : 'Map of\nLeonida'}</Text>
            <Text style={styles.mapCaption}>{named} {tr ? 'doğrulanmış konum' : 'confirmed places'}</Text>
          </View>
          <View style={styles.mapGo}><Ionicons name="arrow-forward" size={20} color={colors.onPrimary} /></View>
        </Pressable>
      </Section>

      <Section>
        <SectionTitle title={STRINGS.map.regions[lang]} />
      </Section>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {REGIONS.map((r) => (
          <PhotoTile key={r.id} photo={r.photo as PhotoKey} title={r.name} caption={countFor(r.match) ? `${countFor(r.match)} ${STRINGS.map.count[lang]}` : t(r.tagline, lang)} onPress={() => router.push(`/region/${r.id}` as never)} style={styles.regionCard} height={220} />
        ))}
      </ScrollView>

      <Section>
        <PhotoTile photo="sunset_tree" title={STRINGS.glossary.title[lang]} caption={tr ? 'İngilizce terimler, Türkçe açıklama' : 'Game terms explained'} onPress={() => router.push('/glossary')} height={130} />
      </Section>

      <Section>
        <SectionTitle title={STRINGS.common.latest[lang]} />
        {bundle.updates.map((u) => (
          <Card key={u.id} meta={u.kind} title={t(u.title, lang)} subtitle={t(u.body, lang)} onPress={u.href ? () => router.push(u.href as never) : undefined} />
        ))}
        <Card photo="vc_sign" title={STRINGS.common.howVerify[lang]} subtitle={tr ? 'Her kodu perakende sürümde kendimiz deniyoruz.' : 'We test every code on a retail copy.'} onPress={() => router.push('/guide/how-we-verify')} />
        <Pressable onPress={() => router.push('/legal')}><Text style={styles.legal}>{STRINGS.common.legal[lang]}</Text></Pressable>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTop: { position: 'absolute', left: 0, right: 0, top: 0 },
  topBar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { color: colors.text, fontFamily: fonts.display, fontSize: 22, letterSpacing: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.full, backgroundColor: 'rgba(7,5,13,0.6)', borderWidth: 1, borderColor: colors.borderStrong },
  pillText: { color: colors.text, fontFamily: fonts.black, fontSize: 11, letterSpacing: 1 },
  heroBottom: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg, gap: 8 },
  eyebrow: { color: colors.yellow, fontFamily: fonts.black, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase' },
  rule: { height: 4, width: 72, borderRadius: 2, marginTop: 4 },
  tagline: { color: colors.text, fontFamily: fonts.semi, fontSize: 16, lineHeight: 22 },
  grid: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  mapTile: { height: 170, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: colors.border },
  mapImg: { position: 'absolute', right: -40, top: -150, width: 470, height: 470 },
  mapText: { position: 'absolute', left: 16, top: 16, bottom: 14, justifyContent: 'space-between' },
  mapEyebrow: { color: colors.accent, fontFamily: fonts.black, fontSize: 10, letterSpacing: 2.4 },
  mapTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 34, lineHeight: 38, textTransform: 'uppercase' },
  mapCaption: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  mapGo: { position: 'absolute', right: 14, bottom: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md },
  regionCard: { width: 158 },
  legal: { color: colors.textFaint, fontFamily: fonts.semi, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.md },
});
