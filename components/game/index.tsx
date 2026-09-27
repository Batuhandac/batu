import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Icon, Button } from '@/components/ds';
import { PetFace } from '@/components/art';
import { useTheme, radius, hairline } from '@/lib/theme';
import { PASTELS, PASTEL_INK } from '@/lib/art/faces';
import type { Badge, Step } from '@/lib/game';

export function ProgressBar({ value, color, track, height = 8 }: { value: number; color?: string; track?: string; height?: number }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track ?? t.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? t.primary }} />
    </View>
  );
}

/** Rozet kutucuğu: kazanılmışsa renkli, değilse gri ve kilitli. */
export function BadgeTile({ badge, earned, size = 64 }: { badge: Badge; earned: boolean; size?: number }) {
  const t = useTheme();
  const mode = t.dark ? 'dark' : 'light';
  return (
    <View style={{ alignItems: 'center', width: size + 28 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.34,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: earned ? PASTELS[mode][badge.tint] : t.surfaceAlt,
        }}
      >
        <Icon name={earned ? badge.icon : 'lock-closed'} size={size * 0.44} color={earned ? PASTEL_INK[mode][badge.tint] : t.textSubtle} />
      </View>
      <Text variant="caption" center numberOfLines={2} style={{ marginTop: 6, fontWeight: earned ? '700' : '600' }} tone={earned ? 'default' : 'subtle'}>
        {badge.title}
      </Text>
    </View>
  );
}

/** Yeni kullanıcı için beş adımlık başlangıç listesi. */
export function FirstStepsCard({ steps, onStep, onClose }: { steps: Step[]; onStep: (id: string) => void; onClose: () => void }) {
  const t = useTheme();
  const bg = PASTELS[t.dark ? 'dark' : 'light'].mint;
  const done = steps.filter((s) => s.done).length;
  const all = done === steps.length;
  return (
    <View style={{ borderRadius: radius.lg, backgroundColor: bg, padding: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="headline">{all ? 'Hazırsın!' : 'İlk adımlar'}</Text>
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {all ? 'Acil anında ve her gün, dostun için her şey hazır.' : `${done}/${steps.length} tamam · her adım pati puanı kazandırır`}
          </Text>
        </View>
        <PetFace species={all ? 'dog' : 'cat'} fur={all ? 'cream' : 'ginger'} seed="ilk-adim" mood={all ? 'wink' : 'happy'} size={54} />
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar value={done / steps.length} track={t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)'} />
      </View>
      {all ? (
        <Button title="Harika" size="sm" onPress={onClose} style={{ alignSelf: 'flex-start', marginTop: 14 }} />
      ) : (
        <View style={{ marginTop: 8 }}>
          {steps.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => !s.done && onStep(s.id)}
              disabled={s.done}
              accessibilityRole="button"
              accessibilityState={{ checked: s.done }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderTopWidth: i === 0 ? 0 : hairline,
                borderTopColor: t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? t.primary : 'transparent',
                  borderWidth: s.done ? 0 : 1.5,
                  borderColor: t.borderStrong,
                }}
              >
                {s.done ? <Icon name="checkmark" size={15} color={t.onPrimary} /> : null}
              </View>
              <Text variant="body" style={[{ flex: 1, fontWeight: '600' }, s.done ? { textDecorationLine: 'line-through', opacity: 0.55 } : null]}>
                {s.title}
              </Text>
              {!s.done ? <Icon name="chevron-forward" size={16} color={t.textSubtle} /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** Ana sayfadaki kısa karne: seviye, puan, ilerleme ve rozet sayısı. */
export function KarneCard({
  levelName,
  points,
  progress,
  toNext,
  nextName,
  earned,
  total,
  streak,
  onPress,
}: {
  levelName: string;
  points: number;
  progress: number;
  toNext: number;
  nextName: string | null;
  earned: number;
  total: number;
  streak: number;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pati karnen: ${levelName}, ${points} pati`}
      style={({ pressed }) => ({ borderRadius: radius.lg, backgroundColor: t.surface, padding: 16, opacity: pressed ? 0.75 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: PASTELS[t.dark ? 'dark' : 'light'].butter, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trophy" size={26} color={PASTEL_INK[t.dark ? 'dark' : 'light'].butter} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline">{levelName}</Text>
          <Text variant="caption" tone="muted">
            {points} pati{nextName ? ` · ${nextName} için ${toNext} pati daha` : ' · en yüksek seviye'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={17} color={t.textSubtle} />
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar value={progress} />
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
        <Text variant="caption" tone="muted">
          <Text variant="caption" style={{ fontWeight: '800' }}>
            {earned}/{total}
          </Text>{' '}
          rozet
        </Text>
        {streak > 0 ? (
          <Text variant="caption" tone="muted">
            <Icon name="flame" size={12} color={t.honey} />{' '}
            <Text variant="caption" style={{ fontWeight: '800' }}>
              {streak}
            </Text>{' '}
            zamanında bakım serisi
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Yeni rozet kutlaması. */
export function NewBadgeSheet({ badges, onClose }: { badges: Badge[]; onClose: () => void }) {
  const t = useTheme();
  React.useEffect(() => {
    if (badges.length) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [badges.length]);
  if (!badges.length) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'center', padding: 28 }} onPress={onClose} accessibilityLabel="Kapat">
        <Pressable style={{ backgroundColor: t.surface, borderRadius: radius.xl, padding: 24, alignItems: 'center' }} onPress={() => {}}>
          <PetFace species="dog" fur="cream" seed="rozet" mood="wink" size={96} background="butter" />
          <Text variant="title" center style={{ marginTop: 12 }}>
            {badges.length === 1 ? 'Yeni rozet!' : `${badges.length} yeni rozet!`}
          </Text>
          <Text variant="callout" tone="muted" center style={{ marginTop: 4 }}>
            Dostun için yaptıkların boşa gitmiyor.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 }}>
            {badges.slice(0, 6).map((b) => (
              <BadgeTile key={b.id} badge={b} earned size={58} />
            ))}
          </View>
          <Button title="Harika" full onPress={onClose} style={{ marginTop: 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
