import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Section } from '@/components/ui/Screen';
import { PhotoHeader } from '@/components/PhotoHeader';
import { Card } from '@/components/ui/Card';
import { GameSwitch } from '@/components/GameSwitch';
import { colors, fonts, gradients, radius, spacing } from '@/constants/theme';
import { STRINGS, t } from '@/constants/i18n';
import { PHOTOS } from '@/content/media';
import { useContent } from '@/stores/contentStore';
import { useSettings } from '@/stores/settingsStore';

export default function Missions() {
  const router = useRouter();
  const lang = useSettings((s) => s.lang);
  const game = useSettings((s) => s.game);
  const all = useContent((s) => s.bundle.missions);
  const missions = useMemo(() => all.filter((m) => m.game === game).sort((a, b) => a.order - b.order), [all, game]);
  const tr = lang === 'tr';

  return (
    <Screen bleed>
      <PhotoHeader photo="heist" title={STRINGS.tabs.missions[lang]} eyebrow={tr ? 'Altın madalya · atlama · taktik' : 'Gold medals · skips · tactics'} right={<GameSwitch />} />
      <Section>
        {missions.length === 0 && (
          <>
            <View style={styles.lock}>
              <Image source={PHOTOS.robbery} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['rgba(7,5,13,0.55)', 'rgba(7,5,13,0.9)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="lock-closed" size={26} color={colors.yellow} />
              <Text style={styles.lockTitle}>{game === 'gta6' ? STRINGS.common.locked[lang] : (tr ? 'Hazırlanıyor' : 'In the works')}</Text>
              <Text style={styles.lockText}>{STRINGS.common.emptyMissions[lang]}</Text>
            </View>
            <Card photo="jason_bike" meta={tr ? 'Rehber' : 'Guide'} title={tr ? 'Görev atlama nasıl çalışır?' : 'How mission skipping works'} subtitle={tr ? 'GTA V sistemi ve GTA VI beklentisi.' : 'The GTA V system and what to expect.'} onPress={() => router.push('/guide/mission-skip-explained')} />
            <Card photo="sunset_tree" meta="TR / EN" title={STRINGS.glossary.title[lang]} subtitle={tr ? 'Checkpoint, Gold Medal, Replay ne demek?' : 'Checkpoint, Gold Medal, Replay explained.'} onPress={() => router.push('/glossary')} />
          </>
        )}
        {missions.map((m) => (
          <Card key={m.id} meta={`#${m.order} · ${STRINGS.protagonist[m.protagonist][lang]} · ${t(m.chapter, lang)}`} title={t(m.title, lang)} subtitle={t(m.summary, lang)} status={m.status} onPress={() => router.push(`/mission/${m.slug}` as never)} />
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lock: { height: 230, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  lockTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 32, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
  lockText: { color: colors.textMuted, fontFamily: fonts.semi, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
